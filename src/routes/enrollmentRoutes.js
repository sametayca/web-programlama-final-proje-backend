const express = require('express');
const router = express.Router();
const { Enrollment, CourseSection, User } = require('../models');
const { body, param } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const authGuard = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const enrollmentService = require('../services/enrollmentService');

// Enroll in a course section (Student only)
router.post(
  '/',
  authGuard,
  roleGuard('student'),
  [
    body('sectionId').isUUID().withMessage('Invalid section ID'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const enrollment = await enrollmentService.enroll(req.user.id, req.body.sectionId);
      
      const enrollmentWithDetails = await Enrollment.findByPk(enrollment.id, {
        include: [{
          model: CourseSection,
          as: 'section',
          include: [{
            model: require('../models').Course,
            as: 'course',
            attributes: ['id', 'code', 'name']
          }]
        }]
      });

      res.status(201).json({
        success: true,
        message: 'Successfully enrolled in course',
        data: enrollmentWithDetails
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Drop enrollment (Student only)
router.delete(
  '/:id',
  authGuard,
  roleGuard('student'),
  [
    param('id').isUUID().withMessage('Invalid enrollment ID'),
    validateRequest
  ],
  async (req, res) => {
    try {
      await enrollmentService.drop(req.params.id, req.user.id);
      res.json({
        success: true,
        message: 'Successfully dropped from course'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get my courses (Student only)
router.get(
  '/my-courses',
  authGuard,
  roleGuard('student'),
  async (req, res) => {
    try {
      const enrollments = await Enrollment.findAll({
        where: {
          studentId: req.user.id,
          status: 'enrolled'
        },
        include: [{
          model: CourseSection,
          as: 'section',
          include: [
            {
              model: require('../models').Course,
              as: 'course',
              attributes: ['id', 'code', 'name', 'credits']
            },
            {
              model: User,
              as: 'instructor',
              attributes: ['id', 'firstName', 'lastName']
            },
            {
              model: require('../models').Classroom,
              as: 'classroom',
              attributes: ['id', 'building', 'roomNumber']
            }
          ]
        }],
        order: [['enrollmentDate', 'DESC']]
      });

      res.json({
        success: true,
        data: enrollments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get students in a section (Faculty only)
router.get(
  '/students/:sectionId',
  authGuard,
  roleGuard('faculty', 'admin'),
  [
    param('sectionId').isUUID().withMessage('Invalid section ID'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const section = await CourseSection.findByPk(req.params.sectionId);
      if (!section) {
        return res.status(404).json({
          success: false,
          error: 'Section not found'
        });
      }

      // Check authorization (faculty can only see their own sections)
      if (req.user.role === 'faculty' && section.instructorId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'You are not authorized to view this section'
        });
      }

      const enrollments = await Enrollment.findAll({
        where: {
          sectionId: req.params.sectionId,
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
        }],
        order: [['enrollmentDate', 'ASC']]
      });

      res.json({
        success: true,
        data: enrollments
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

