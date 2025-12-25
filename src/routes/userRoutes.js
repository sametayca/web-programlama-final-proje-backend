const express = require('express');
const { query } = require('express-validator');
const router = express.Router();
const authGuard = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { User, Student, Faculty, Department } = require('../models');
const { Op } = require('sequelize');
const validateRequest = require('../middleware/validateRequest');

// Validation rules
const getUsersValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(['student', 'faculty', 'admin', 'staff']),
  query('departmentId').optional().isUUID(),
  query('search').optional().isString().trim()
];

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get(
  '/',
  authGuard,
  roleGuard(['admin']),
  getUsersValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 10,
        role,
        departmentId,
        search
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause
      const whereClause = {};
      if (role) {
        whereClause.role = role;
      }

      // Search in name or email
      if (search) {
        whereClause[Op.or] = [
          { firstName: { [Op.like]: `%${search}%` } },
          { lastName: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ];
      }

      // Department filter (for students and faculty)
      let includeFilters = [];
      if (departmentId) {
        includeFilters.push({
          model: Student,
          as: 'studentProfile',
          where: { departmentId },
          required: role === 'student'
        });
        includeFilters.push({
          model: Faculty,
          as: 'facultyProfile',
          where: { departmentId },
          required: role === 'faculty'
        });
      } else {
        includeFilters.push({
          model: Student,
          as: 'studentProfile',
          required: false
        });
        includeFilters.push({
          model: Faculty,
          as: 'facultyProfile',
          required: false
        });
      }

      // Get total count
      const totalUsers = await User.count({
        where: whereClause,
        include: includeFilters.filter(inc => inc.required)
      });

      // Get users
      const users = await User.findAll({
        where: whereClause,
        include: [
          {
            model: Student,
            as: 'studentProfile',
            include: [{
              model: Department,
              as: 'department',
              attributes: ['id', 'name', 'code']
            }],
            required: false
          },
          {
            model: Faculty,
            as: 'facultyProfile',
            include: [{
              model: Department,
              as: 'department',
              attributes: ['id', 'name', 'code']
            }],
            required: false
          }
        ],
        attributes: [
          'id',
          'email',
          'firstName',
          'lastName',
          'phone',
          'role',
          'profilePicture',
          'isEmailVerified',
          'isActive',
          'createdAt',
          'updatedAt'
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      // Filter by department if specified
      let filteredUsers = users;
      if (departmentId && !role) {
        filteredUsers = users.filter(user => {
          const studentDept = user.studentProfile?.departmentId;
          const facultyDept = user.facultyProfile?.departmentId;
          return studentDept === departmentId || facultyDept === departmentId;
        });
      }

      const totalPages = Math.ceil(totalUsers / parseInt(limit));

      res.json({
        success: true,
        data: {
          users: filteredUsers,
          pagination: {
            currentPage: parseInt(page),
            totalPages: totalPages,
            totalUsers: totalUsers,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get Users Error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        details: error.parent ? error.parent.message : null // Sequelize specific
      });
    }
  }
);

// @route   PUT /api/users/:id
// @desc    Update user (Admin only)
// @access  Private (Admin)
router.put(
  '/:id',
  authGuard,
  roleGuard(['admin']),
  [
    require('express-validator').param('id').isUUID().withMessage('Invalid user ID'),
    require('express-validator').body('firstName').optional().trim().notEmpty(),
    require('express-validator').body('lastName').optional().trim().notEmpty(),
    require('express-validator').body('role').optional().isIn(['student', 'faculty', 'admin', 'staff']),
    require('express-validator').body('isActive').optional().isBoolean(),
    validateRequest
  ],
  async (req, res, next) => {
    try {
      const user = await User.findByPk(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      await user.update(req.body);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

