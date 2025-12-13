const express = require('express');
const router = express.Router();
const { CourseSection, Course, User, Classroom } = require('../models');
const { body, param, query } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const authGuard = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { Op } = require('sequelize');

// Get all sections (with filtering)
router.get(
  '/',
  [
    query('semester').optional().isIn(['fall', 'spring', 'summer']).withMessage('Invalid semester'),
    query('year').optional().isInt({ min: 2020, max: 2100 }).withMessage('Invalid year'),
    query('instructorId').optional().isUUID().withMessage('Invalid instructor ID'),
    query('courseId').optional().isUUID().withMessage('Invalid course ID'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const whereClause = { isActive: true };
      if (req.query.semester) whereClause.semester = req.query.semester;
      if (req.query.year) whereClause.year = parseInt(req.query.year);
      if (req.query.instructorId) whereClause.instructorId = req.query.instructorId;
      if (req.query.courseId) whereClause.courseId = req.query.courseId;

      const sections = await CourseSection.findAll({
        where: whereClause,
        include: [
          {
            model: Course,
            as: 'course',
            attributes: ['id', 'code', 'name']
          },
          {
            model: User,
            as: 'instructor',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: Classroom,
            as: 'classroom',
            attributes: ['id', 'building', 'roomNumber']
          }
        ],
        order: [['year', 'DESC'], ['semester', 'DESC'], ['sectionNumber', 'ASC']]
      });

      res.json({
        success: true,
        data: sections
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Get section by ID
router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid section ID'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const section = await CourseSection.findByPk(req.params.id, {
        include: [
          {
            model: Course,
            as: 'course',
            include: [{
              model: require('../models').Department,
              as: 'department',
              attributes: ['id', 'name', 'code']
            }]
          },
          {
            model: User,
            as: 'instructor',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: Classroom,
            as: 'classroom',
            attributes: ['id', 'building', 'roomNumber', 'capacity', 'latitude', 'longitude']
          }
        ]
      });

      if (!section) {
        return res.status(404).json({
          success: false,
          error: 'Section not found'
        });
      }

      res.json({
        success: true,
        data: section
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Create section (Admin only)
router.post(
  '/',
  authGuard,
  roleGuard('admin'),
  [
    body('courseId').isUUID().withMessage('Invalid course ID'),
    body('sectionNumber').isInt({ min: 1 }).withMessage('Section number must be a positive integer'),
    body('semester').isIn(['fall', 'spring', 'summer']).withMessage('Invalid semester'),
    body('year').isInt({ min: 2020, max: 2100 }).withMessage('Invalid year'),
    body('instructorId').isUUID().withMessage('Invalid instructor ID'),
    body('capacity').optional().isInt({ min: 1, max: 500 }).withMessage('Capacity must be between 1 and 500'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const section = await CourseSection.create(req.body);
      const createdSection = await CourseSection.findByPk(section.id, {
        include: [
          {
            model: Course,
            as: 'course',
            attributes: ['id', 'code', 'name']
          },
          {
            model: User,
            as: 'instructor',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Section created successfully',
        data: createdSection
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          error: 'Section already exists for this course, semester, and year'
        });
      }
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Update section (Admin only)
router.put(
  '/:id',
  authGuard,
  roleGuard('admin'),
  [
    param('id').isUUID().withMessage('Invalid section ID'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const section = await CourseSection.findByPk(req.params.id);
      if (!section) {
        return res.status(404).json({
          success: false,
          error: 'Section not found'
        });
      }

      await section.update(req.body);
      res.json({
        success: true,
        message: 'Section updated successfully',
        data: section
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

