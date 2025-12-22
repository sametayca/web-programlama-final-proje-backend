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
    // Convert semester format (Fall -> fall)
    const semesterLower = semester ? semester.toLowerCase() : 'fall';
    const yearInt = parseInt(year);
    
    // Get student's enrollments (without strict semester/year filter in where clause)
    const enrollments = await Enrollment.findAll({
      where: { 
        studentId,
        status: 'enrolled'
      },
      include: [
        {
          model: CourseSection,
          as: 'section',
          required: true, // Must have a section
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
              model: Classroom,
              as: 'classroom',
              attributes: ['roomNumber', 'building'],
              required: false
            },
            {
              model: Schedule,
              as: 'schedules',
              where: { 
                semester: semesterLower, 
                year: yearInt, 
                isActive: true 
              },
              required: false,
              include: [
                {
                  model: Classroom,
                  as: 'classroom',
                  attributes: ['roomNumber', 'building'],
                  required: false
                }
              ]
            }
          ]
        }
      ]
    });

    // Filter enrollments by semester and year manually
    const filteredEnrollments = enrollments.filter(enrollment => {
      const section = enrollment.section;
      if (!section || !section.isActive) return false;
      
      // Check if section matches semester and year
      const sectionSemester = (section.semester || '').toLowerCase();
      const sectionYear = parseInt(section.year);
      
      return sectionSemester === semesterLower && sectionYear === yearInt;
    });

    // Transform to schedule format
    // NOTE: Always auto-generate schedule for better distribution
    // Ignore existing Schedule table records to ensure even distribution
    const schedule = [];
    const coursesWithoutSchedule = [];
    
    // Collect all enrollments for auto-generation
    for (const enrollment of filteredEnrollments) {
      const section = enrollment.section;
      if (!section) continue;
      
      // Always add to auto-generate list for even distribution
      // Skip Schedule table and scheduleJson - we'll auto-generate everything
      coursesWithoutSchedule.push(enrollment);
    }

    // Auto-generate schedule for courses without schedule
    if (coursesWithoutSchedule.length > 0) {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const timeSlots = [
        { start: '08:00', end: '10:00' },
        { start: '10:00', end: '12:00' },
        { start: '13:00', end: '15:00' },
        { start: '15:00', end: '17:00' }
      ];
      
      // Track how many courses per day and used time slots per day
      const dayCounts = {
        'Monday': 0,
        'Tuesday': 0,
        'Wednesday': 0,
        'Thursday': 0,
        'Friday': 0
      };
      
      const dayTimeSlots = {
        'Monday': new Set(),
        'Tuesday': new Set(),
        'Wednesday': new Set(),
        'Thursday': new Set(),
        'Friday': new Set()
      };
      
      // Distribute courses evenly across days using round-robin
      for (let i = 0; i < coursesWithoutSchedule.length; i++) {
        const enrollment = coursesWithoutSchedule[i];
        const section = enrollment.section;
        if (!section) continue;
        
        // Round-robin: Find day with least courses
        let selectedDay = days[0];
        let minCount = dayCounts[days[0]];
        
        for (const day of days) {
          if (dayCounts[day] < minCount) {
            minCount = dayCounts[day];
            selectedDay = day;
          }
        }
        
        // If multiple days have same count, prefer days with fewer time slots used
        const candidates = days.filter(d => dayCounts[d] === minCount);
        if (candidates.length > 1) {
          selectedDay = candidates.reduce((minDay, day) => {
            return dayTimeSlots[day].size < dayTimeSlots[minDay].size ? day : minDay;
          }, candidates[0]);
        }
        
        // Find an available time slot for this day
        let timeSlot = null;
        const availableSlots = timeSlots.filter(slot => {
          const slotKey = `${slot.start}-${slot.end}`;
          return !dayTimeSlots[selectedDay].has(slotKey);
        });
        
        if (availableSlots.length > 0) {
          timeSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
        } else {
          // If all slots used, pick any random slot
          timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
        }
        
        // Mark this time slot as used for this day
        const slotKey = `${timeSlot.start}-${timeSlot.end}`;
        dayTimeSlots[selectedDay].add(slotKey);
        dayCounts[selectedDay]++;
        
        schedule.push({
          courseCode: section.course.code,
          courseName: section.course.name,
          credits: section.course.credits,
          sectionNumber: section.sectionNumber,
          instructorName: `${section.instructor.firstName} ${section.instructor.lastName}`,
          classroomName: section.classroom ? section.classroom.roomNumber : 'Belirtilmemiş',
          building: section.classroom ? section.classroom.building : '',
          day: selectedDay,
          startTime: timeSlot.start,
          endTime: timeSlot.end
        });
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

  /**
   * Generate iCal format from schedule
   * @param {Array} schedule
   * @param {string} semester
   * @param {number} year
   * @returns {string}
   */
  generateIcal(schedule, semester, year) {
    const dayMap = {
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
      'Sunday': 0
    };

    // Get semester start and end dates (approximate)
    const semesterStart = this.getSemesterStartDate(semester, year);
    const semesterEnd = this.getSemesterEndDate(semester, year);

    let ical = 'BEGIN:VCALENDAR\r\n';
    ical += 'VERSION:2.0\r\n';
    ical += 'PRODID:-//Smart Campus//Course Schedule//EN\r\n';
    ical += 'CALSCALE:GREGORIAN\r\n';
    ical += 'METHOD:PUBLISH\r\n';

    // Generate events for each week in the semester
    const currentDate = new Date(semesterStart);
    while (currentDate <= semesterEnd) {
      for (const item of schedule) {
        const dayOfWeek = dayMap[item.day];
        if (dayOfWeek === undefined) continue;

        // Find the date for this day in current week
        const eventDate = new Date(currentDate);
        const currentDay = eventDate.getDay();
        const diff = dayOfWeek - (currentDay === 0 ? 7 : currentDay);
        eventDate.setDate(eventDate.getDate() + diff);

        if (eventDate > semesterEnd) continue;

        // Parse time
        const [startHours, startMinutes] = (item.startTime || '09:00').split(':').map(Number);
        const [endHours, endMinutes] = (item.endTime || '11:00').split(':').map(Number);

        const start = new Date(eventDate);
        start.setHours(startHours, startMinutes, 0, 0);

        const end = new Date(eventDate);
        end.setHours(endHours, endMinutes, 0, 0);

        // Format dates for iCal (YYYYMMDDTHHMMSS)
        const formatDate = (date) => {
          return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        ical += 'BEGIN:VEVENT\r\n';
        ical += `UID:${item.courseCode}-${item.day}-${formatDate(start)}\r\n`;
        ical += `DTSTART:${formatDate(start)}\r\n`;
        ical += `DTEND:${formatDate(end)}\r\n`;
        ical += `SUMMARY:${item.courseCode} - ${item.courseName || ''}\r\n`;
        ical += `DESCRIPTION:${item.instructorName || ''}\\n${item.classroomName || ''} (${item.building || ''})\r\n`;
        ical += `LOCATION:${item.building || ''} ${item.classroomName || ''}\r\n`;
        ical += `RRULE:FREQ=WEEKLY;UNTIL=${formatDate(semesterEnd)};BYDAY=${item.day.substring(0, 2).toUpperCase()}\r\n`;
        ical += 'END:VEVENT\r\n';
      }

      // Move to next week
      currentDate.setDate(currentDate.getDate() + 7);
    }

    ical += 'END:VCALENDAR\r\n';
    return ical;
  }

  /**
   * Get semester start date
   * @param {string} semester
   * @param {number} year
   * @returns {Date}
   */
  getSemesterStartDate(semester, year) {
    if (semester.toLowerCase() === 'fall') {
      return new Date(year, 8, 1); // September
    } else if (semester.toLowerCase() === 'spring') {
      return new Date(year, 1, 1); // February
    } else {
      return new Date(year, 5, 1); // June (Summer)
    }
  }

  /**
   * Get semester end date
   * @param {string} semester
   * @param {number} year
   * @returns {Date}
   */
  getSemesterEndDate(semester, year) {
    if (semester.toLowerCase() === 'fall') {
      return new Date(year, 11, 31); // December
    } else if (semester.toLowerCase() === 'spring') {
      return new Date(year, 5, 30); // June
    } else {
      return new Date(year, 7, 31); // August (Summer)
    }
  }
}

module.exports = new SchedulingService();

