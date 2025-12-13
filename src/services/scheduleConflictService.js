class ScheduleConflictService {
  /**
   * Check if two time ranges overlap
   * @param {Object} schedule1 - { days: ['monday', 'wednesday'], startTime: '09:00', endTime: '10:30' }
   * @param {Object} schedule2 - { days: ['monday', 'wednesday'], startTime: '10:00', endTime: '11:30' }
   * @returns {boolean}
   */
  hasTimeOverlap(schedule1, schedule2) {
    // Check if they share any common day
    const commonDays = schedule1.days?.filter(day => 
      schedule2.days?.includes(day)
    );

    if (!commonDays || commonDays.length === 0) {
      return false; // No common days, no conflict
    }

    // Parse times (HH:MM format)
    const parseTime = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes; // Convert to minutes
    };

    const start1 = parseTime(schedule1.startTime);
    const end1 = parseTime(schedule1.endTime);
    const start2 = parseTime(schedule2.startTime);
    const end2 = parseTime(schedule2.endTime);

    // Check if time ranges overlap
    return (start1 < end2 && start2 < end1);
  }

  /**
   * Check if new section schedule conflicts with student's existing enrollments
   * @param {string} studentId - Student ID
   * @param {Object} newSectionSchedule - Schedule of the section to enroll
   * @returns {Promise<{hasConflict: boolean, conflictingSections: Array}>}
   */
  async checkScheduleConflict(studentId, newSectionSchedule) {
    const { Enrollment, CourseSection } = require('../models');

    // Get all active enrollments for the student
    const enrollments = await Enrollment.findAll({
      where: {
        studentId,
        status: 'enrolled'
      },
      include: [{
        model: CourseSection,
        as: 'section',
        attributes: ['id', 'scheduleJson', 'semester', 'year'],
        include: [{
          model: require('../models').Course,
          as: 'course',
          attributes: ['id', 'code', 'name']
        }]
      }]
    });

    const conflictingSections = [];

    for (const enrollment of enrollments) {
      const existingSchedule = enrollment.section?.scheduleJson;
      
      if (!existingSchedule || !newSectionSchedule) {
        continue;
      }

      // Check if same semester and year
      if (
        enrollment.section.semester === newSectionSchedule.semester &&
        enrollment.section.year === newSectionSchedule.year
      ) {
        if (this.hasTimeOverlap(existingSchedule, newSectionSchedule)) {
          conflictingSections.push({
            sectionId: enrollment.section.id,
            courseCode: enrollment.section.course?.code,
            courseName: enrollment.section.course?.name,
            schedule: existingSchedule
          });
        }
      }
    }

    return {
      hasConflict: conflictingSections.length > 0,
      conflictingSections
    };
  }
}

module.exports = new ScheduleConflictService();

