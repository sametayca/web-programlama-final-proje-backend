const express = require('express');
const router = express.Router();
const { AttendanceSession, AttendanceRecord, CourseSection, User, ExcuseRequest } = require('../models');
const { body, param, query } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const authGuard = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const attendanceService = require('../services/attendanceService');
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
          attributes: ['id', 'code', 'name']
        }]
      });

      if (!section) {
        return res.status(404).json({
          success: false,
          error: 'Section not found'
        });
      }

      // Check if user is the instructor (for faculty)
      if (req.user.role === 'faculty' && section.instructorId !== instructorId) {
        return res.status(403).json({
          success: false,
          error: 'You are not authorized to create sessions for this section'
        });
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
        latitude: section.classroom.latitude,
        longitude: section.classroom.longitude,
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
    body('sessionId').isUUID().withMessage('Invalid session ID'),
    body('reason').isLength({ min: 10, max: 1000 }).withMessage('Reason must be between 10 and 1000 characters'),
    body('documentUrl').optional().isURL().withMessage('Invalid document URL'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { sessionId, reason, documentUrl } = req.body;
      const studentId = req.user.id;

      // Check if session exists
      const session = await AttendanceSession.findByPk(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Attendance session not found'
        });
      }

      // Check if already has excuse request
      const existingRequest = await ExcuseRequest.findOne({
        where: { studentId, sessionId }
      });

      if (existingRequest) {
        return res.status(400).json({
          success: false,
          error: 'Excuse request already exists for this session'
        });
      }

      const excuseRequest = await ExcuseRequest.create({
        studentId,
        sessionId,
        reason,
        documentUrl,
        status: 'pending'
      });

      res.status(201).json({
        success: true,
        message: 'Excuse request submitted successfully',
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

