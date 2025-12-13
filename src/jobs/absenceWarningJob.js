const cron = require('node-cron');
const { Enrollment, User, Student, CourseSection, AttendanceSession, AttendanceRecord, ExcuseRequest } = require('../models');
const { Op } = require('sequelize');
const attendanceService = require('../services/attendanceService');
const emailService = require('../services/emailService');

/**
 * Absence Warning Job
 * Runs daily at 9:00 AM to check attendance rates and send warnings
 */
class AbsenceWarningJob {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Calculate attendance rate for a student in a section
   */
  async calculateAttendanceRate(sectionId, studentId) {
    const stats = await attendanceService.calculateAttendanceStats(sectionId, studentId);
    return stats.attendancePercentage;
  }

  /**
   * Send warning email to student
   */
  async sendWarningEmail(student, section, attendancePercentage, isCritical = false) {
    try {
      const course = section.course;
      const subject = isCritical 
        ? `🚨 Critical: Low Attendance in ${course.code}`
        : `⚠️ Warning: Low Attendance in ${course.code}`;
      
      const message = isCritical
        ? `
          <h2>Critical Attendance Warning</h2>
          <p>Dear ${student.firstName} ${student.lastName},</p>
          <p>Your attendance rate in <strong>${course.code} - ${course.name}</strong> is currently <strong>${attendancePercentage.toFixed(1)}%</strong>, which is below the critical threshold of 70%.</p>
          <p>Please contact your instructor and academic advisor immediately to discuss your attendance situation.</p>
          <p>Section: ${section.sectionNumber} | Semester: ${section.semester} ${section.year}</p>
          <p>Best regards,<br>Akıllı Kampüs Yönetim Platformu</p>
        `
        : `
          <h2>Attendance Warning</h2>
          <p>Dear ${student.firstName} ${student.lastName},</p>
          <p>Your attendance rate in <strong>${course.code} - ${course.name}</strong> is currently <strong>${attendancePercentage.toFixed(1)}%</strong>, which is below the recommended threshold of 80%.</p>
          <p>Please make sure to attend classes regularly to maintain good academic standing.</p>
          <p>Section: ${section.sectionNumber} | Semester: ${section.semester} ${section.year}</p>
          <p>Best regards,<br>Akıllı Kampüs Yönetim Platformu</p>
        `;

      await emailService.sendEmail(student.email, subject, message);
      console.log(`✅ Warning email sent to ${student.email} for ${course.code}`);
    } catch (error) {
      console.error(`❌ Failed to send warning email to ${student.email}:`, error.message);
    }
  }

  /**
   * Notify advisor about critical attendance
   */
  async notifyAdvisor(student, section, attendancePercentage) {
    try {
      // Get advisor (for now, we'll log it - can be extended to send email to advisor)
      console.log(`📧 Advisor notification needed for student ${student.email} - ${section.course.code} (${attendancePercentage.toFixed(1)}%)`);
      // TODO: Implement advisor notification when advisor system is added
    } catch (error) {
      console.error('❌ Failed to notify advisor:', error.message);
    }
  }

  /**
   * Process absence warnings for all students
   */
  async processAbsenceWarnings() {
    if (this.isRunning) {
      console.log('⏭️ Absence warning job is already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('🔄 Starting absence warning job...');

    try {
      // Get all active enrollments
      const enrollments = await Enrollment.findAll({
        where: {
          status: 'enrolled'
        },
        include: [{
          model: User,
          as: 'student',
          include: [{
            model: Student,
            as: 'studentProfile'
          }]
        }, {
          model: CourseSection,
          as: 'section',
          include: [{
            model: require('../models').Course,
            as: 'course'
          }]
        }]
      });

      console.log(`📊 Checking attendance for ${enrollments.length} enrollments...`);

      let warningCount = 0;
      let criticalCount = 0;

      for (const enrollment of enrollments) {
        try {
          const attendancePercentage = await this.calculateAttendanceRate(
            enrollment.sectionId,
            enrollment.studentId
          );

          // Check if warning threshold is met (>= 20% absence = < 80% attendance)
          if (attendancePercentage < 80 && attendancePercentage >= 70) {
            // Warning level (20-30% absence)
            await this.sendWarningEmail(
              enrollment.student,
              enrollment.section,
              attendancePercentage,
              false
            );
            warningCount++;
          } else if (attendancePercentage < 70) {
            // Critical level (>= 30% absence)
            await this.sendWarningEmail(
              enrollment.student,
              enrollment.section,
              attendancePercentage,
              true
            );
            await this.notifyAdvisor(
              enrollment.student,
              enrollment.section,
              attendancePercentage
            );
            criticalCount++;
          }
        } catch (error) {
          console.error(`❌ Error processing enrollment ${enrollment.id}:`, error.message);
        }
      }

      console.log(`✅ Absence warning job completed:`);
      console.log(`   - Warnings sent: ${warningCount}`);
      console.log(`   - Critical warnings sent: ${criticalCount}`);
    } catch (error) {
      console.error('❌ Absence warning job failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Start the cron job
   */
  start() {
    // Run daily at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
      await this.processAbsenceWarnings();
    }, {
      scheduled: true,
      timezone: "Europe/Istanbul"
    });

    console.log('✅ Absence warning job scheduled (daily at 9:00 AM)');

    // Also run immediately in development for testing
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Running absence warning job immediately (development mode)...');
      this.processAbsenceWarnings();
    }
  }

  /**
   * Stop the cron job
   */
  stop() {
    // Cron jobs are automatically cleaned up when process exits
    console.log('⏹️ Absence warning job stopped');
  }
}

module.exports = new AbsenceWarningJob();

