const express = require('express');
const router = express.Router();
const { Course, CoursePrerequisite, Department } = require('../models');
const { body, param, query } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const authGuard = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { cacheMiddleware, invalidateCache } = require('../middleware/cache');
const { Op } = require('sequelize');

// Get all courses (with pagination, filtering, search)
// Cache for 30 minutes (1800 seconds)
router.get(
  '/',
  cacheMiddleware(1800),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('departmentId').optional().isUUID().withMessage('Invalid department ID'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 12;
      const offset = (page - 1) * limit;
      const { search, departmentId } = req.query;

      const whereClause = { isActive: true };
      if (departmentId) whereClause.departmentId = departmentId;
      if (search) {
        whereClause[Op.or] = [
          { code: { [Op.iLike]: `%${search}%` } },
          { name: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows: courses } = await Course.findAndCountAll({
        where: whereClause,
        include: [{
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code']
        }],
        limit,
        offset,
        order: [['code', 'ASC']]
      });

      res.json({
        success: true,
        data: {
          courses,
          pagination: {
            page,
            limit,
            totalCourses: count,
            totalPages: Math.ceil(count / limit)
          }
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

// Get course by ID (with prerequisites)
router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid course ID'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const course = await Course.findByPk(req.params.id, {
        include: [
          {
            model: Department,
            as: 'department',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Course,
            as: 'prerequisites',
            through: { attributes: [] },
            attributes: ['id', 'code', 'name']
          },
          {
            model: require('../models').CourseSection,
            as: 'sections',
            where: { isActive: true },
            required: false,
            include: [{
              model: require('../models').User,
              as: 'instructor',
              attributes: ['id', 'firstName', 'lastName']
            }, {
              model: require('../models').Classroom,
              as: 'classroom',
              attributes: ['id', 'building', 'roomNumber']
            }]
          }
        ]
      });

      if (!course) {
        return res.status(404).json({
          success: false,
          error: 'Course not found'
        });
      }

      res.json({
        success: true,
        data: course
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Create course (Admin only)
// Invalidate course cache after creation
router.post(
  '/',
  authGuard,
  roleGuard('admin'),
  invalidateCache(['cache:GET:/api/v1/courses:*']),
  [
    body('code').notEmpty().withMessage('Course code is required'),
    body('name').notEmpty().withMessage('Course name is required'),
    body('credits').isInt({ min: 1, max: 10 }).withMessage('Credits must be between 1 and 10'),
    body('ects').isInt({ min: 1, max: 10 }).withMessage('ECTS must be between 1 and 10'),
    body('departmentId').isUUID().withMessage('Invalid department ID'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const course = await Course.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: course
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          error: 'Course code already exists'
        });
      }
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Update course (Admin only)
router.put(
  '/:id',
  authGuard,
  roleGuard('admin'),
  [
    param('id').isUUID().withMessage('Invalid course ID'),
    body('code').optional().notEmpty().withMessage('Course code cannot be empty'),
    body('name').optional().notEmpty().withMessage('Course name cannot be empty'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const course = await Course.findByPk(req.params.id);
      if (!course) {
        return res.status(404).json({
          success: false,
          error: 'Course not found'
        });
      }

      await course.update(req.body);
      res.json({
        success: true,
        message: 'Course updated successfully',
        data: course
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// Delete course (soft delete, Admin only)
router.delete(
  '/:id',
  authGuard,
  roleGuard('admin'),
  [
    param('id').isUUID().withMessage('Invalid course ID'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const course = await Course.findByPk(req.params.id);
      if (!course) {
        return res.status(404).json({
          success: false,
          error: 'Course not found'
        });
      }

      await course.update({ isActive: false });
      res.json({
        success: true,
        message: 'Course deleted successfully'
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

