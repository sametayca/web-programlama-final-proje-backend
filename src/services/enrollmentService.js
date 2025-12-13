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

