const prerequisiteService = require('./prerequisiteService');
const scheduleConflictService = require('./scheduleConflictService');
const { Enrollment, CourseSection } = require('../models');
const { Op } = require('sequelize');

class EnrollmentService {
  /**
   * Enroll student in a course section
   * @param {string} studentId - Student ID
   * @param {string} sectionId - Section ID
   * @returns {Promise<Object>}
   */
  async enroll(studentId, sectionId) {
    // Get section with course info
    const section = await CourseSection.findByPk(sectionId, {
      include: [{
        model: require('../models').Course,
        as: 'course',
        attributes: ['id', 'code', 'name']
      }]
    });

    if (!section) {
      throw new Error('Section not found');
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      where: { studentId, sectionId }
    });

    if (existingEnrollment) {
      throw new Error('You are already enrolled in this section');
    }

    // Check capacity (atomic update)
    if (section.enrolledCount >= section.capacity) {
      throw new Error('Section is full');
    }

    // Check prerequisites
    const prereqCheck = await prerequisiteService.checkPrerequisites(
      section.courseId,
      studentId
    );

    if (!prereqCheck.satisfied) {
      const missing = prereqCheck.missing.map(p => p.code || p.courseId).join(', ');
      throw new Error(`Prerequisites not met. Missing: ${missing}`);
    }

    // Check schedule conflict
    const conflictCheck = await scheduleConflictService.checkScheduleConflict(
      studentId,
      {
        days: section.scheduleJson?.days || [],
        startTime: section.scheduleJson?.startTime,
        endTime: section.scheduleJson?.endTime,
        semester: section.semester,
        year: section.year
      }
    );

    if (conflictCheck.hasConflict) {
      const conflicting = conflictCheck.conflictingSections
        .map(s => s.courseCode)
        .join(', ');
      throw new Error(`Schedule conflict detected with: ${conflicting}`);
    }

    // Atomic enrollment: Update capacity and create enrollment in transaction
    const transaction = await require('../models').sequelize.transaction();

    try {
      // Increment enrolled count (atomic)
      const [updatedRows] = await CourseSection.update(
        { enrolledCount: section.enrolledCount + 1 },
        {
          where: {
            id: sectionId,
            enrolledCount: { [Op.lt]: section.capacity }
          },
          transaction
        }
      );

      if (updatedRows === 0) {
        throw new Error('Section is full or capacity check failed');
      }

      // Create enrollment
      const enrollment = await Enrollment.create({
        studentId,
        sectionId,
        status: 'enrolled',
        enrollmentDate: new Date()
      }, { transaction });

      await transaction.commit();

      return enrollment;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Auto-enroll student in all courses from their department (for new students)
   * This bypasses prerequisite checks as students are automatically enrolled in their department's courses
   * @param {string} studentId - Student ID
   * @param {string} departmentId - Department ID
   * @returns {Promise<Array>} Array of created enrollments
   */
  async autoEnrollByDepartment(studentId, departmentId) {
    const { Course, CourseSection, Student } = require('../models');
    const { Op } = require('sequelize');

    // Get student info
    const student = await Student.findOne({
      where: { userId: studentId }
    });

    if (!student) {
      throw new Error('Student profile not found');
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const semester = currentMonth >= 0 && currentMonth < 6 ? 'spring' : 'fall';

    // Get all active courses from student's department
    const courses = await Course.findAll({
      where: {
        departmentId: departmentId,
        isActive: true
      }
    });

    if (courses.length === 0) {
      return []; // No courses to enroll in
    }

    const courseIds = courses.map(c => c.id);

    // Get all active sections for these courses in current semester/year
    const sections = await CourseSection.findAll({
      where: {
        courseId: { [Op.in]: courseIds },
        semester: semester,
        year: currentYear,
        isActive: true
      },
      include: [{
        model: Course,
        as: 'course',
        attributes: ['id', 'code', 'name']
      }]
    });

    if (sections.length === 0) {
      return []; // No sections available
    }

    const enrollments = [];
    const transaction = await require('../models').sequelize.transaction();

    try {
      // Track enrolled sections to check conflicts within the same batch
      const enrolledSections = [];

      for (const section of sections) {
        // Skip if already enrolled
        const existing = await Enrollment.findOne({
          where: { studentId, sectionId: section.id },
          transaction
        });

        if (existing) {
          continue;
        }

        // Skip if section is full
        if (section.enrolledCount >= section.capacity) {
          console.log(`Section ${section.id} (${section.course.code}) is full, skipping...`);
          continue;
        }

        // Check schedule conflict with already enrolled sections (in this batch and existing)
        const sectionSchedule = {
          days: section.scheduleJson?.days || [],
          startTime: section.scheduleJson?.startTime,
          endTime: section.scheduleJson?.endTime,
          semester: section.semester,
          year: section.year
        };

        // Check conflict with existing enrollments
        const conflictCheck = await scheduleConflictService.checkScheduleConflict(
          studentId,
          sectionSchedule
        );

        if (conflictCheck.hasConflict) {
          const conflicting = conflictCheck.conflictingSections
            .map(s => s.courseCode)
            .join(', ');
          console.log(`⚠️ Skipping ${section.course.code} due to schedule conflict with: ${conflicting}`);
          continue;
        }

        // Check conflict with sections in current batch
        let hasBatchConflict = false;
        for (const enrolledSection of enrolledSections) {
          if (
            enrolledSection.semester === section.semester &&
            enrolledSection.year === section.year
          ) {
            const conflict = scheduleConflictService.hasTimeOverlap(
              enrolledSection.scheduleJson,
              section.scheduleJson
            );
            if (conflict) {
              console.log(`⚠️ Skipping ${section.course.code} due to batch conflict with ${enrolledSection.course.code}`);
              hasBatchConflict = true;
              break;
            }
          }
        }

        if (hasBatchConflict) {
          continue;
        }

        // Atomic enrollment: Update capacity and create enrollment
        const [updatedRows] = await CourseSection.update(
          { enrolledCount: section.enrolledCount + 1 },
          {
            where: {
              id: section.id,
              enrolledCount: { [Op.lt]: section.capacity }
            },
            transaction
          }
        );

        if (updatedRows === 0) {
          console.log(`Failed to update capacity for section ${section.id}, skipping...`);
          continue;
        }

        // Create enrollment (no prerequisite check for auto-enrollment)
        const enrollment = await Enrollment.create({
          studentId,
          sectionId: section.id,
          status: 'enrolled',
          enrollmentDate: new Date()
        }, { transaction });

        enrollments.push(enrollment);
        
        // Track this section for batch conflict checking
        enrolledSections.push({
          ...section.toJSON(),
          course: section.course
        });
      }

      await transaction.commit();
      return enrollments;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Drop enrollment
   * @param {string} enrollmentId - Enrollment ID
   * @param {string} studentId - Student ID (for authorization)
   * @returns {Promise<Object>}
   */
  async drop(enrollmentId, studentId) {
    const enrollment = await Enrollment.findByPk(enrollmentId, {
      include: [{
        model: CourseSection,
        as: 'section'
      }]
    });

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    if (enrollment.studentId !== studentId) {
      throw new Error('Unauthorized');
    }

    if (enrollment.status !== 'enrolled') {
      throw new Error('Can only drop enrolled courses');
    }

    // Check drop period (first 4 weeks)
    const enrollmentDate = new Date(enrollment.enrollmentDate);
    const weeksSinceEnrollment = (Date.now() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24 * 7);

    if (weeksSinceEnrollment > 4) {
      throw new Error('Drop period has ended. You can only drop courses within the first 4 weeks.');
    }

    const transaction = await require('../models').sequelize.transaction();

    try {
      // Update enrollment status
      await enrollment.update({ status: 'dropped' }, { transaction });

      // Decrement section capacity
      await CourseSection.update(
        { enrolledCount: enrollment.section.enrolledCount - 1 },
        {
          where: { id: enrollment.sectionId },
          transaction
        }
      );

      await transaction.commit();
      return enrollment;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = new EnrollmentService();

