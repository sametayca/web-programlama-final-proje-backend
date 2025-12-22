const express = require('express');
const router = express.Router();
const schedulingController = require('../controllers/schedulingController');
const authGuard = require('../middleware/auth');
const { body, query } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

/**
 * @swagger
 * tags:
 *   name: Scheduling
 *   description: Course scheduling with CSP algorithm
 */

/**
 * @swagger
 * /api/v1/scheduling/generate:
 *   post:
 *     summary: Generate course schedule using CSP backtracking
 *     tags: [Scheduling]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - semester
 *               - year
 *             properties:
 *               semester:
 *                 type: string
 *                 example: Fall
 *               year:
 *                 type: integer
 *                 example: 2024
 *     responses:
 *       200:
 *         description: Schedule generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     schedule:
 *                       type: array
 *                       items:
 *                         type: object
 *                     metadata:
 *                       type: object
 *       403:
 *         description: Forbidden - Only admins
 *       404:
 *         description: No sections or classrooms found
 *       409:
 *         description: Unable to satisfy constraints
 */
router.post(
  '/generate',
  authGuard,
  [
    body('semester').notEmpty().withMessage('Semester is required'),
    body('year').isInt({ min: 2020, max: 2050 }).withMessage('Valid year is required'),
    validateRequest
  ],
  schedulingController.generateSchedule
);

/**
 * @swagger
 * /api/v1/scheduling/my-schedule:
 *   get:
 *     summary: Get student's personal schedule
 *     tags: [Scheduling]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: semester
 *         required: true
 *         schema:
 *           type: string
 *           example: Fall
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           example: 2024
 *     responses:
 *       200:
 *         description: Student's schedule
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       courseCode:
 *                         type: string
 *                       courseName:
 *                         type: string
 *                       instructorName:
 *                         type: string
 *                       classroomName:
 *                         type: string
 *                       day:
 *                         type: string
 *                       startTime:
 *                         type: string
 *                       endTime:
 *                         type: string
 *       403:
 *         description: Forbidden - Only students
 */
router.get(
  '/my-schedule',
  authGuard,
  [
    query('semester').notEmpty().withMessage('Semester is required'),
    query('year').isInt({ min: 2020, max: 2050 }).withMessage('Valid year is required'),
    validateRequest
  ],
  schedulingController.getMySchedule
);

module.exports = router;

