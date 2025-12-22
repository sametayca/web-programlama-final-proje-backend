const { CourseSection, Classroom, Course, User, Schedule, Enrollment, sequelize } = require('../models');
const logger = require('../config/logger');

// Time slots (2-hour blocks)
const TIME_SLOTS = [
  { day: 'Monday', startTime: '09:00', endTime: '11:00' },
  { day: 'Monday', startTime: '11:00', endTime: '13:00' },
  { day: 'Monday', startTime: '13:00', endTime: '15:00' },
  { day: 'Monday', startTime: '15:00', endTime: '17:00' },
  
  { day: 'Tuesday', startTime: '09:00', endTime: '11:00' },
  { day: 'Tuesday', startTime: '11:00', endTime: '13:00' },
  { day: 'Tuesday', startTime: '13:00', endTime: '15:00' },
  { day: 'Tuesday', startTime: '15:00', endTime: '17:00' },
  
  { day: 'Wednesday', startTime: '09:00', endTime: '11:00' },
  { day: 'Wednesday', startTime: '11:00', endTime: '13:00' },
  { day: 'Wednesday', startTime: '13:00', endTime: '15:00' },
  { day: 'Wednesday', startTime: '15:00', endTime: '17:00' },
  
  { day: 'Thursday', startTime: '09:00', endTime: '11:00' },
  { day: 'Thursday', startTime: '11:00', endTime: '13:00' },
  { day: 'Thursday', startTime: '13:00', endTime: '15:00' },
  { day: 'Thursday', startTime: '15:00', endTime: '17:00' },
  
  { day: 'Friday', startTime: '09:00', endTime: '11:00' },
  { day: 'Friday', startTime: '11:00', endTime: '13:00' },
  { day: 'Friday', startTime: '13:00', endTime: '15:00' },
  { day: 'Friday', startTime: '15:00', endTime: '17:00' }
];

class SchedulingService {
  /**
   * Generate schedule using CSP backtracking algorithm
   * @param {string} semester - Semester (e.g., 'Fall', 'Spring')
   * @param {number} year - Year
   * @returns {Promise<Object>}
   */
  async generateSchedule(semester, year) {
    try {
      // 1. Get all sections for this semester
      const sections = await CourseSection.findAll({
        where: {
          semester,
          year,
          isActive: true
        },
        include: [
          {
            model: Course,
            as: 'course',
            attributes: ['code', 'name', 'credits']
          },
          {
            model: User,
            as: 'instructor',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      });

      if (sections.length === 0) {
        throw new Error('No sections found for this semester');
      }

      // 2. Get all available classrooms
      const classrooms = await Classroom.findAll({
        where: { isActive: true },
        order: [['capacity', 'DESC']]
      });

      if (classrooms.length === 0) {
        throw new Error('No classrooms available');
      }

      logger.info(`Starting scheduling: ${sections.length} sections, ${classrooms.length} classrooms`);

      // 3. Run CSP backtracking algorithm
      const assignments = {};
      const result = await this.backtrack(sections, classrooms, assignments, 0);

      if (!result) {
        throw new Error('Unable to generate schedule - constraints cannot be satisfied');
      }

      // 4. Calculate soft constraint score
      const score = this.calculateSoftConstraintScore(result);

      // 5. Prepare schedule output
      const schedule = await this.prepareScheduleOutput(result, semester, year);

      // 6. Save to database
      await this.saveSchedule(result, semester, year);

      return {
        schedule,
        metadata: {
          totalSections: sections.length,
          scheduledSections: Object.keys(result).length,
          unscheduledSections: sections.length - Object.keys(result).length,
          hardConstraintsSatisfied: true,
          softConstraintsScore: score,
          generatedAt: new Date()
        }
      };
    } catch (error) {
      logger.error('Error in generateSchedule:', error);
      throw error;
    }
  }

  /**
   * Backtracking algorithm (CSP solver)
   * @param {Array} sections - All sections to schedule
   * @param {Array} classrooms - Available classrooms
   * @param {Object} assignments - Current assignments
   * @param {number} index - Current section index
   * @returns {Object|null} - Assignments or null if failed
   */
  async backtrack(sections, classrooms, assignments, index) {
    // Base case: all sections assigned
    if (index >= sections.length) {
      return assignments;
    }

    const section = sections[index];

    // MRV heuristic: select section with fewest valid options
    // (Already sorted by index, but could be improved)

    // Try each classroom + time slot combination
    for (const classroom of classrooms) {
      // LCV heuristic: try least constraining values first
      const orderedSlots = this.orderTimeSlots(section, classroom, assignments);

      for (const timeSlot of orderedSlots) {
        // Check hard constraints
        if (this.isConsistent(section, classroom, timeSlot, assignments)) {
          // Make assignment
          assignments[section.id] = {
            section,
            classroom,
            timeSlot
          };

          // Recursive backtrack
          const result = await this.backtrack(sections, classrooms, assignments, index + 1);

          if (result) {
            return result;
          }

          // Backtrack (undo assignment)
          delete assignments[section.id];
        }
      }
    }

    // No valid assignment found
    return null;
  }

  /**
   * Check if assignment satisfies hard constraints
   * @param {Object} section - Section to assign
   * @param {Object} classroom - Classroom to assign
   * @param {Object} timeSlot - Time slot to assign
   * @param {Object} assignments - Current assignments
   * @returns {boolean}
   */
  isConsistent(section, classroom, timeSlot, assignments) {
    // Hard Constraint 1: Capacity
    if (classroom.capacity < section.enrolledCount) {
      return false;
    }

    // Hard Constraint 2: Instructor conflict
    for (const key in assignments) {
      const assigned = assignments[key];
      
      if (assigned.section.instructorId === section.instructorId &&
          assigned.timeSlot.day === timeSlot.day &&
          this.timesOverlap(assigned.timeSlot, timeSlot)) {
        return false;
      }

      // Hard Constraint 3: Classroom conflict
      if (assigned.classroom.id === classroom.id &&
          assigned.timeSlot.day === timeSlot.day &&
          this.timesOverlap(assigned.timeSlot, timeSlot)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if two time slots overlap
   * @param {Object} slot1
   * @param {Object} slot2
   * @returns {boolean}
   */
  timesOverlap(slot1, slot2) {
    const start1 = this.timeToMinutes(slot1.startTime);
    const end1 = this.timeToMinutes(slot1.endTime);
    const start2 = this.timeToMinutes(slot2.startTime);
    const end2 = this.timeToMinutes(slot2.endTime);

    return (start1 < end2 && start2 < end1);
  }

  /**
   * Convert time string to minutes
   * @param {string} time - Time in HH:MM format
   * @returns {number}
   */
  timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Order time slots (LCV heuristic)
   * @param {Object} section
   * @param {Object} classroom
   * @param {Object} assignments
   * @returns {Array}
   */
  orderTimeSlots(section, classroom, assignments) {
    // Simple ordering: prefer earlier time slots
    // Could be improved with actual constraint counting
    return [...TIME_SLOTS];
  }

  /**
   * Calculate soft constraint score
   * @param {Object} assignments
   * @returns {number} - Score 0-100
   */
  calculateSoftConstraintScore(assignments) {
    let totalScore = 0;
    let count = 0;

    for (const key in assignments) {
      const assigned = assignments[key];
      
      // Soft Constraint 1: Weekly distribution
      // Prefer spreading courses across different days
      const daysUsed = this.getDaysUsedByInstructor(assigned.section.instructorId, assignments);
      const distributionScore = (daysUsed.size / 5) * 50; // Max 50 points

      // Soft Constraint 2: Instructor preferences
      // Prefer morning slots (arbitrary preference for now)
      const preferenceScore = assigned.timeSlot.startTime === '09:00' ? 50 : 25;

      totalScore += distributionScore + preferenceScore;
      count++;
    }

    return count > 0 ? Math.round(totalScore / count) : 0;
  }

  /**
   * Get days used by instructor
   * @param {string} instructorId
   * @param {Object} assignments
   * @returns {Set}
   */
  getDaysUsedByInstructor(instructorId, assignments) {
    const days = new Set();
    
    for (const key in assignments) {
      const assigned = assignments[key];
      if (assigned.section.instructorId === instructorId) {
        days.add(assigned.timeSlot.day);
      }
    }
    
    return days;
  }

  /**
   * Prepare schedule output
   * @param {Object} assignments
   * @param {string} semester
   * @param {number} year
   * @returns {Promise<Array>}
   */
  async prepareScheduleOutput(assignments, semester, year) {
    const schedule = [];

    for (const key in assignments) {
      const assigned = assignments[key];
      
      schedule.push({
        sectionId: assigned.section.id,
        courseCode: assigned.section.course.code,
        courseName: assigned.section.course.name,
        sectionNumber: assigned.section.sectionNumber,
        instructorName: `${assigned.section.instructor.firstName} ${assigned.section.instructor.lastName}`,
        classroomId: assigned.classroom.id,
        classroomName: assigned.classroom.name,
        building: assigned.classroom.building,
        day: assigned.timeSlot.day,
        startTime: assigned.timeSlot.startTime,
        endTime: assigned.timeSlot.endTime,
        enrolledCount: assigned.section.enrolledCount,
        capacity: assigned.classroom.capacity,
        semester,
        year
      });
    }

    return schedule.sort((a, b) => {
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      if (dayDiff !== 0) return dayDiff;
      return a.startTime.localeCompare(b.startTime);
    });
  }

  /**
   * Save schedule to database
   * @param {Object} assignments
   * @param {string} semester
   * @param {number} year
   * @returns {Promise<void>}
   */
  async saveSchedule(assignments, semester, year) {
    const t = await sequelize.transaction();

    try {
      // Delete existing schedules for this semester/year
      await Schedule.destroy({
        where: { semester, year },
        transaction: t
      });

      // Insert new schedules
      const schedules = [];
      for (const key in assignments) {
        const assigned = assignments[key];
        
        schedules.push({
          sectionId: assigned.section.id,
          classroomId: assigned.classroom.id,
          day: assigned.timeSlot.day,
          startTime: assigned.timeSlot.startTime,
          endTime: assigned.timeSlot.endTime,
          semester,
          year,
          isActive: true
        });
      }

      await Schedule.bulkCreate(schedules, { transaction: t });

      await t.commit();
      logger.info(`Saved ${schedules.length} schedules to database`);
    } catch (error) {
      await t.rollback();
      logger.error('Error saving schedule:', error);
      throw error;
    }
  }

  /**
   * Get student's personal schedule
   * @param {string} studentId - Student user ID
   * @param {string} semester
   * @param {number} year
   * @returns {Promise<Array>}
   */
  async getMySchedule(studentId, semester, year) {
    // Get student's enrollments
    const enrollments = await Enrollment.findAll({
      where: { studentId },
      include: [
        {
          model: CourseSection,
          as: 'section',
          where: { semester, year },
          include: [
            {
              model: Course,
              as: 'course',
              attributes: ['code', 'name', 'credits']
            },
            {
              model: User,
              as: 'instructor',
              attributes: ['firstName', 'lastName']
            },
            {
              model: Schedule,
              as: 'schedules',
              where: { semester, year, isActive: true },
              required: false,
              include: [
                {
                  model: Classroom,
                  as: 'classroom',
                  attributes: ['name', 'building', 'capacity']
                }
              ]
            }
          ]
        }
      ]
    });

    // Transform to schedule format
    const schedule = [];
    
    for (const enrollment of enrollments) {
      const section = enrollment.section;
      
      if (section.schedules && section.schedules.length > 0) {
        for (const sched of section.schedules) {
          schedule.push({
            courseCode: section.course.code,
            courseName: section.course.name,
            credits: section.course.credits,
            sectionNumber: section.sectionNumber,
            instructorName: `${section.instructor.firstName} ${section.instructor.lastName}`,
            classroomName: sched.classroom.name,
            building: sched.classroom.building,
            day: sched.day,
            startTime: sched.startTime,
            endTime: sched.endTime
          });
        }
      }
    }

    // Sort by day and time
    return schedule.sort((a, b) => {
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      if (dayDiff !== 0) return dayDiff;
      return a.startTime.localeCompare(b.startTime);
    });
  }
}

module.exports = new SchedulingService();

