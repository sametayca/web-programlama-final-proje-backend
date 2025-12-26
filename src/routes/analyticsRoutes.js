const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authGuard = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

// Base Route: /api/v1/analytics

// All routes require authentication and admin role
router.use(authGuard);
router.use(roleGuard('admin'));

/**
 * @swagger
 * /api/v1/analytics/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get('/dashboard', analyticsController.getDashboardStats);

/**
 * @swagger
 * /api/v1/analytics/academic-performance:
 *   get:
 *     summary: Get academic performance analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Academic performance data including GPA by department, grade distribution
 */
router.get('/academic-performance', analyticsController.getAcademicPerformance);

/**
 * @swagger
 * /api/v1/analytics/attendance:
 *   get:
 *     summary: Get attendance analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendance analytics including rates by course and trends
 */
router.get('/attendance', analyticsController.getAttendanceAnalytics);

/**
 * @swagger
 * /api/v1/analytics/meal-usage:
 *   get:
 *     summary: Get meal usage analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Meal usage data including daily counts and peak hours
 */
router.get('/meal-usage', analyticsController.getMealAnalytics);

/**
 * @swagger
 * /api/v1/analytics/events:
 *   get:
 *     summary: Get event analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Event analytics including popular events and category breakdown
 */
router.get('/events', analyticsController.getEventAnalytics);

/**
 * @swagger
 * /api/v1/analytics/export/{type}:
 *   get:
 *     summary: Export analytics report
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [academic, attendance, meal, event]
 *         description: Report type to export
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [excel, pdf, csv]
 *           default: excel
 *         description: Export format
 *     responses:
 *       200:
 *         description: File download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/export/:type', analyticsController.exportReport);

module.exports = router;
