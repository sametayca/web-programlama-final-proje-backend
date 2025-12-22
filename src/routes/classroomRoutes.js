const express = require('express');
const router = express.Router();
const classroomController = require('../controllers/classroomController');
const authGuard = require('../middleware/auth');
const { query } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

/**
 * @swagger
 * tags:
 *   name: Classrooms
 *   description: Classroom management
 */

/**
 * @swagger
 * /api/v1/classrooms:
 *   get:
 *     summary: Get all classrooms
 *     tags: [Classrooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: building
 *         schema:
 *           type: string
 *         description: Filter by building
 *       - in: query
 *         name: capacity
 *         schema:
 *           type: integer
 *         description: Minimum capacity
 *     responses:
 *       200:
 *         description: List of classrooms
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  authGuard,
  [
    query('building').optional().isString(),
    query('capacity').optional().isInt(),
    validateRequest
  ],
  classroomController.listClassrooms
);

/**
 * @swagger
 * /api/v1/classrooms/{id}:
 *   get:
 *     summary: Get classroom by ID
 *     tags: [Classrooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Classroom details
 *       404:
 *         description: Classroom not found
 */
router.get('/:id', authGuard, classroomController.getClassroom);

module.exports = router;

