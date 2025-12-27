const express = require('express');
const router = express.Router();
const { AttendanceSession, AttendanceRecord, CourseSection, User, ExcuseRequest, Course, Enrollment } = require('../models');
const { body, param, query } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const authGuard = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const attendanceService = require('../services/attendanceService');
const logger = require('../config/logger');
const crypto = require('crypto');
const { Op } = require('sequelize');

// Create attendance session (Faculty only)
router.post(
  '/sessions',
  authGuard,
  roleGuard('faculty', 'admin'),
  [
    body('sectionId').isUUID().withMessage('Invalid section ID'),
    body('date').isISO8601().withMessage('Invalid date format'),
    body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time format (HH:MM)'),
    body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid end time format (HH:MM)'),
    body('geofenceRadius').optional().isFloat({ min: 5, max: 100 }).withMessage('Geofence radius must be between 5 and 100 meters'),
    body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { sectionId, date, startTime, endTime, geofenceRadius } = req.body;
      const instructorId = req.user.id;

      // Get section with classroom info
      const section = await CourseSection.findByPk(sectionId, {
        include: [{
          model: require('../models').Classroom,
          as: 'classroom',
          attributes: ['id', 'latitude', 'longitude', 'building', 'roomNumber']
        }, {
          model: require('../models').Course,
          as: 'course',
          attributes: ['id', 'code', 'name', 'departmentId']
        }]
      });

      if (!section) {
        return res.status(404).json({
          success: false,
          error: 'Section not found'
        });
      }

      // Check authorization: Faculty can create sessions for sections in their department
      if (req.user.role === 'faculty') {
        // If not the instructor, check if section's course belongs to faculty's department
        if (section.instructorId !== instructorId) {
          const { Faculty } = require('../models');
          const facultyProfile = await Faculty.findOne({
            where: { userId: instructorId },
            attributes: ['departmentId']
          });

          if (!facultyProfile) {
            return res.status(403).json({
              success: false,
              error: 'Faculty profile not found'
            });
          }

          // Check if section's course belongs to faculty's department
          if (!section.course || section.course.departmentId !== facultyProfile.departmentId) {
            return res.status(403).json({
              success: false,
              error: 'You are not authorized to create sessions for this section. You can only create sessions for sections in your department.'
            });
          }
        }
      }

      if (!section.classroom) {
        return res.status(400).json({
          success: false,
          error: 'Section does not have a classroom assigned'
        });
      }

      // Generate unique QR code
      const qrCode = crypto.randomBytes(16).toString('hex');
      const qrCodeExpiresAt = new Date();
      qrCodeExpiresAt.setMinutes(qrCodeExpiresAt.getMinutes() + 30); // 30 minutes expiry

      const session = await AttendanceSession.create({
        sectionId,
        instructorId,
        date,
        startTime,
        endTime,
        latitude: req.body.latitude || section.classroom.latitude,
        longitude: req.body.longitude || section.classroom.longitude,
        geofenceRadius: geofenceRadius || 15.00,
        qrCode,
        qrCodeExpiresAt,
        status: 'active'
      });

      const createdSession = await AttendanceSession.findByPk(session.id, {
        include: [{
          model: CourseSection,
          as: 'section',
          include: [{
            model: require('../models').Course,
            as: 'course',
            attributes: ['id', 'code', 'name']
          }, {
            model: require('../models').Classroom,
            as: 'classroom',
            attributes: ['id', 'building', 'roomNumber']
          }]
        }]
      });

      // Notify enrolled students about the new session (async, non-blocking)
      const { Enrollment } = require('../models');
      Enrollment.findAll({
        where: {
          sectionId: sectionId,
          status: 'enrolled'
        },
        include: [{
          model: User,
          as: 'student',
          attributes: ['id', 'email', 'firstName', 'lastName']
        }]
      }).then(async (enrollments) => {
        const emailService = require('../services/emailService');
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        const sessionUrl = `${frontendUrl}/attendance/give/${session.id}`;

        for (const enrollment of enrollments) {
          try {
            const subject = `📅 Attendance Session Started: ${section.course.code}`;
            const message = `
              <h2>Attendance Session Started</h2>
              <p>Dear ${enrollment.student.firstName} ${enrollment.student.lastName},</p>
              <p>An attendance session has been started for <strong>${section.course.code} - ${section.course.name}</strong>.</p>
              <p><strong>Date:</strong> ${date}</p>
              <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
              <p><strong>Location:</strong> ${section.classroom.building} ${section.classroom.roomNumber}</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${sessionUrl}" style="display: inline-block; padding: 14px 28px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Give Attendance
                </a>
              </div>
              <p>Please give your attendance using the link above or through the "My Attendance" page.</p>
              <p>Best regards,<br>Akıllı Kampüs Yönetim Platformu</p>
            `;
            await emailService.sendEmail(enrollment.student.email, subject, message);
            console.log(`✅ Notification sent to ${enrollment.student.email}`);
          } catch (error) {
            console.error(`❌ Failed to send notification to ${enrollment.student.email}:`, error.message);
          }
        }
      }).catch(err => {
        console.error('⚠️ Error notifying students:', err.message);
      });

      res.status(201).json({
        success: true,
        message: 'Attendance session created successfully',
        data: createdSession
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get session by ID
router.get(
  '/sessions/:id',
  authGuard,
  [
    param('id').isUUID().withMessage('Invalid session ID'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const session = await AttendanceSession.findByPk(req.params.id, {
        include: [{
          model: CourseSection,
          as: 'section',
          include: [{
            model: require('../models').Course,
            as: 'course',
            attributes: ['id', 'code', 'name']
          }, {
            model: require('../models').Classroom,
            as: 'classroom',
            attributes: ['id', 'building', 'roomNumber', 'latitude', 'longitude']
          }]
        }, {
          model: User,
          as: 'instructor',
          attributes: ['id', 'firstName', 'lastName']
        }, {
          model: AttendanceRecord,
          as: 'records',
          attributes: ['id', 'studentId', 'checkInTime', 'isFlagged'],
          include: [{
            model: User,
            as: 'student',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }]
        }]
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Attendance session not found'
        });
      }

      res.json({
        success: true,
        data: session
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Close attendance session (Faculty only)
router.put(
  '/sessions/:id/close',
  authGuard,
  roleGuard('faculty', 'admin'),
  [
    param('id').isUUID().withMessage('Invalid session ID'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const session = await AttendanceSession.findByPk(req.params.id);

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Attendance session not found'
        });
      }

      // Check authorization
      if (req.user.role === 'faculty' && session.instructorId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'You are not authorized to close this session'
        });
      }

      await session.update({ status: 'closed' });

      res.json({
        success: true,
        message: 'Attendance session closed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get my sessions (Faculty only)
router.get(
  '/sessions/my-sessions',
  authGuard,
  roleGuard('faculty', 'admin'),
  async (req, res) => {
    try {
      const instructorId = req.user.id;
      const { status, sectionId } = req.query;

      const whereClause = { instructorId };
      if (status) whereClause.status = status;
      if (sectionId) whereClause.sectionId = sectionId;

      const sessions = await AttendanceSession.findAll({
        where: whereClause,
        include: [{
          model: CourseSection,
          as: 'section',
          include: [{
            model: require('../models').Course,
            as: 'course',
            attributes: ['id', 'code', 'name']
          }]
        }],
        order: [['date', 'DESC'], ['startTime', 'DESC']]
      });

      res.json({
        success: true,
        data: sessions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Check-in for attendance (Student only)
router.post(
  '/sessions/:id/checkin',
  authGuard,
  roleGuard('student'),
  [
    param('id').isUUID().withMessage('Invalid session ID'),
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    body('accuracy').optional().isFloat({ min: 0 }).withMessage('Invalid accuracy'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { id: sessionId } = req.params;
      const { latitude, longitude, accuracy } = req.body;
      const studentId = req.user.id;

      // Check if already checked in
      const hasCheckedIn = await attendanceService.hasCheckedIn(sessionId, studentId);
      if (hasCheckedIn) {
        return res.status(400).json({
          success: false,
          error: 'You have already checked in for this session'
        });
      }

      // Create attendance record
      const result = await attendanceService.createAttendanceRecord(
        sessionId,
        studentId,
        latitude,
        longitude,
        accuracy
      );

      res.status(201).json({
        success: true,
        message: 'Attendance recorded successfully',
        data: {
          record: result.record,
          distance: result.distance,
          isFlagged: result.isFlagged,
          flagReason: result.flagReason
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get active sessions for student (Student only)
router.get(
  '/sessions/active',
  authGuard,
  roleGuard('student'),
  async (req, res) => {
    try {
      const studentId = req.user.id;
      const { Enrollment } = require('../models');

      // Get all enrollments for the student
      const enrollments = await Enrollment.findAll({
        where: {
          studentId,
          status: 'enrolled'
        },
        include: [{
          model: CourseSection,
          as: 'section',
          attributes: ['id']
        }]
      });

      const sectionIds = enrollments.map(e => e.sectionId);

      if (sectionIds.length === 0) {
        return res.json({
          success: true,
          data: []
        });
      }

      // Get active sessions for these sections
      const activeSessions = await AttendanceSession.findAll({
        where: {
          sectionId: { [Op.in]: sectionIds },
          status: 'active',
          date: new Date().toISOString().split('T')[0] // Today's sessions
        },
        include: [{
          model: CourseSection,
          as: 'section',
          include: [{
            model: require('../models').Course,
            as: 'course',
            attributes: ['id', 'code', 'name']
          }, {
            model: require('../models').Classroom,
            as: 'classroom',
            attributes: ['id', 'building', 'roomNumber']
          }]
        }, {
          model: User,
          as: 'instructor',
          attributes: ['id', 'firstName', 'lastName']
        }],
        order: [['startTime', 'ASC']]
      });

      // Check which sessions the student has already checked in
      const sessionIds = activeSessions.map(s => s.id);
      const checkedInRecords = await AttendanceRecord.findAll({
        where: {
          sessionId: { [Op.in]: sessionIds },
          studentId
        },
        attributes: ['sessionId']
      });
      const checkedInSessionIds = new Set(checkedInRecords.map(r => r.sessionId));

      // Add checked-in status to each session
      const sessionsWithStatus = activeSessions.map(session => ({
        ...session.toJSON(),
        hasCheckedIn: checkedInSessionIds.has(session.id)
      }));

      res.json({
        success: true,
        data: sessionsWithStatus
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get sessions for a section (Student only - for excuse requests)
router.get(
  '/sessions/section/:sectionId',
  authGuard,
  roleGuard('student'),
  [
    param('sectionId').isUUID().withMessage('Invalid section ID'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { sectionId } = req.params;
      const studentId = req.user.id;

      // Verify student is enrolled in this section
      const { Enrollment } = require('../models');
      const enrollment = await Enrollment.findOne({
        where: {
          sectionId,
          studentId,
          status: 'enrolled'
        }
      });

      if (!enrollment) {
        return res.status(403).json({
          success: false,
          error: 'You are not enrolled in this section'
        });
      }

      // Get all sessions for this section
      const sessions = await AttendanceSession.findAll({
        where: { sectionId },
        order: [['date', 'DESC'], ['startTime', 'DESC']]
      });

      // Get attendance records for this student
      const sessionIds = sessions.map(s => s.id);
      const records = await AttendanceRecord.findAll({
        where: {
          sessionId: { [Op.in]: sessionIds },
          studentId
        }
      });
      const attendedSessionIds = new Set(records.map(r => r.sessionId));

      // Get already excused sessions
      const excusedRequests = await ExcuseRequest.findAll({
        where: {
          sessionId: { [Op.in]: sessionIds },
          studentId,
          status: { [Op.in]: ['pending', 'approved'] }
        }
      });
      const excusedSessionIds = new Set(excusedRequests.map(r => r.sessionId));

      // Filter sessions where student was absent and doesn't have pending/approved excuse
      const availableSessions = sessions
        .filter(session => {
          const hasAttended = attendedSessionIds.has(session.id);
          const hasExcuse = excusedSessionIds.has(session.id);
          return !hasAttended && !hasExcuse;
        })
        .map(session => ({
          id: session.id,
          sessionId: session.id,
          date: session.date,
          startTime: session.startTime,
          endTime: session.endTime,
          status: 'absent'
        }));

      res.json({
        success: true,
        data: availableSessions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get my attendance (Student only)
router.get(
  '/my-attendance',
  authGuard,
  roleGuard('student'),
  async (req, res) => {
    try {
      const studentId = req.user.id;
      const { sectionId } = req.query;

      // Get all enrollments
      const { Enrollment } = require('../models');
      const enrollments = await Enrollment.findAll({
        where: {
          studentId,
          status: 'enrolled'
        },
        include: [{
          model: CourseSection,
          as: 'section',
          where: sectionId ? { id: sectionId } : {},
          include: [{
            model: require('../models').Course,
            as: 'course',
            attributes: ['id', 'code', 'name']
          }]
        }]
      });

      const attendanceData = await Promise.all(
        enrollments.map(async (enrollment) => {
          const stats = await attendanceService.calculateAttendanceStats(
            enrollment.sectionId,
            studentId
          );

          return {
            sectionId: enrollment.sectionId,
            course: enrollment.section.course,
            attendance: stats
          };
        })
      );

      res.json({
        success: true,
        data: attendanceData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get attendance report for a section (Faculty only)
router.get(
  '/report/:sectionId',
  authGuard,
  roleGuard('faculty', 'admin'),
  [
    param('sectionId').isUUID().withMessage('Invalid section ID'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { sectionId } = req.params;
      const userId = req.user.id;

      // Check authorization
      const section = await CourseSection.findByPk(sectionId);
      if (!section) {
        return res.status(404).json({
          success: false,
          error: 'Section not found'
        });
      }

      if (req.user.role === 'faculty' && section.instructorId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'You are not authorized to view this report'
        });
      }

      // Get all enrollments for this section
      const { Enrollment } = require('../models');
      const enrollments = await Enrollment.findAll({
        where: {
          sectionId,
          status: 'enrolled'
        },
        include: [{
          model: User,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          include: [{
            model: require('../models').Student,
            as: 'studentProfile',
            attributes: ['studentNumber']
          }]
        }]
      });

      // Get attendance stats for each student
      const report = await Promise.all(
        enrollments.map(async (enrollment) => {
          const stats = await attendanceService.calculateAttendanceStats(
            sectionId,
            enrollment.studentId
          );

          // Get flagged records
          const sessions = await AttendanceSession.findAll({
            where: { sectionId },
            attributes: ['id']
          });
          const sessionIds = sessions.map(s => s.id);

          const flaggedRecords = await AttendanceRecord.count({
            where: {
              sessionId: { [Op.in]: sessionIds },
              studentId: enrollment.studentId,
              isFlagged: true
            }
          });

          return {
            student: enrollment.student,
            attendance: stats,
            flaggedCount: flaggedRecords
          };
        })
      );

      res.json({
        success: true,
        data: {
          section: {
            id: section.id,
            sectionNumber: section.sectionNumber
          },
          report
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Create excuse request (Student only)
router.post(
  '/excuse-requests',
  authGuard,
  roleGuard('student'),
  [
    body('sessionId').isUUID().withMessage('Geçersiz oturum ID'),
    body('reason').isLength({ min: 10, max: 1000 }).withMessage('Mazeret sebebi 10 ile 1000 karakter arasında olmalıdır'),
    body('documentUrl').optional().isURL().withMessage('Geçersiz belge URL'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { sessionId, reason, documentUrl } = req.body;
      const studentId = req.user.id;

      // Check if session exists and get section info
      const session = await AttendanceSession.findByPk(sessionId, {
        include: [{
          model: CourseSection,
          as: 'section',
          include: [{
            model: Course,
            as: 'course',
            attributes: ['id', 'code', 'name']
          }]
        }]
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Yoklama oturumu bulunamadı'
        });
      }

      // Verify student is enrolled in this section
      const enrollment = await Enrollment.findOne({
        where: {
          sectionId: session.sectionId,
          studentId,
          status: 'enrolled'
        }
      });

      if (!enrollment) {
        return res.status(403).json({
          success: false,
          error: 'Bu derse kayıtlı değilsiniz'
        });
      }

      // Check if already has excuse request
      const existingRequest = await ExcuseRequest.findOne({
        where: { studentId, sessionId }
      });

      if (existingRequest) {
        return res.status(400).json({
          success: false,
          error: 'Bu oturum için zaten mazeret talebiniz mevcut'
        });
      }

      const excuseRequest = await ExcuseRequest.create({
        studentId,
        sessionId,
        reason,
        documentUrl,
        status: 'pending'
      });

      // Load full excuse request with relations for response
      const fullRequest = await ExcuseRequest.findByPk(excuseRequest.id, {
        include: [{
          model: AttendanceSession,
          as: 'session',
          include: [{
            model: CourseSection,
            as: 'section',
            include: [{
              model: Course,
              as: 'course',
              attributes: ['id', 'code', 'name']
            }]
          }]
        }]
      });

      res.status(201).json({
        success: true,
        message: `Mazeret talebiniz ${session.section.course.code} dersinin öğretim üyesine gönderildi`,
        data: fullRequest
      });
    } catch (error) {
      logger.error('Error creating excuse request:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Mazeret talebi oluşturulamadı'
      });
    }
  }
);

// Get excuse requests (Faculty only)
router.get(
  '/excuse-requests',
  authGuard,
  roleGuard('faculty', 'admin'),
  [
    query('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status'),
    query('sectionId').optional().isUUID().withMessage('Invalid section ID'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { status, sectionId } = req.query;
      const userId = req.user.id;

      const whereClause = {};
      if (status) whereClause.status = status;

      // If faculty, only show requests for their sections
      if (req.user.role === 'faculty') {
        const sections = await CourseSection.findAll({
          where: { instructorId: userId },
          attributes: ['id']
        });
        const sectionIds = sections.map(s => s.id);

        const sessions = await AttendanceSession.findAll({
          where: {
            sectionId: { [Op.in]: sectionIds },
            ...(sectionId && { sectionId })
          },
          attributes: ['id']
        });
        const sessionIds = sessions.map(s => s.id);
        whereClause.sessionId = { [Op.in]: sessionIds };
      } else if (sectionId) {
        whereClause.sessionId = sectionId;
      }

      const excuseRequests = await ExcuseRequest.findAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          include: [{
            model: require('../models').Student,
            as: 'studentProfile',
            attributes: ['studentNumber']
          }]
        }, {
          model: AttendanceSession,
          as: 'session',
          include: [{
            model: CourseSection,
            as: 'section',
            include: [{
              model: require('../models').Course,
              as: 'course',
              attributes: ['id', 'code', 'name']
            }]
          }]
        }],
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: excuseRequests
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Approve excuse request (Faculty only)
router.put(
  '/excuse-requests/:id/approve',
  authGuard,
  roleGuard('faculty', 'admin'),
  [
    param('id').isUUID().withMessage('Invalid excuse request ID'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const userId = req.user.id;

      const excuseRequest = await ExcuseRequest.findByPk(id, {
        include: [{
          model: AttendanceSession,
          as: 'session',
          include: [{
            model: CourseSection,
            as: 'section'
          }]
        }]
      });

      if (!excuseRequest) {
        return res.status(404).json({
          success: false,
          error: 'Excuse request not found'
        });
      }

      // Check authorization
      if (req.user.role === 'faculty' && excuseRequest.session.section.instructorId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'You are not authorized to approve this request'
        });
      }

      await excuseRequest.update({
        status: 'approved',
        reviewedBy: userId,
        reviewedAt: new Date(),
        notes
      });

      res.json({
        success: true,
        message: 'Excuse request approved successfully',
        data: excuseRequest
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Reject excuse request (Faculty only)
router.put(
  '/excuse-requests/:id/reject',
  authGuard,
  roleGuard('faculty', 'admin'),
  [
    param('id').isUUID().withMessage('Invalid excuse request ID'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const userId = req.user.id;

      const excuseRequest = await ExcuseRequest.findByPk(id, {
        include: [{
          model: AttendanceSession,
          as: 'session',
          include: [{
            model: CourseSection,
            as: 'section'
          }]
        }]
      });

      if (!excuseRequest) {
        return res.status(404).json({
          success: false,
          error: 'Excuse request not found'
        });
      }

      // Check authorization
      if (req.user.role === 'faculty' && excuseRequest.session.section.instructorId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'You are not authorized to reject this request'
        });
      }

      await excuseRequest.update({
        status: 'rejected',
        reviewedBy: userId,
        reviewedAt: new Date(),
        notes
      });

      res.json({
        success: true,
        message: 'Excuse request rejected',
        data: excuseRequest
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

module.exports = router;

