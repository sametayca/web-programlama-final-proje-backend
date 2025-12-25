const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authGuard = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

// Base Route: /api/v1/analytics

// All routes require authentication and admin role
router.use(authGuard);
router.use(roleGuard('admin'));

router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/academic-performance', analyticsController.getAcademicPerformance);
router.get('/attendance', analyticsController.getAttendanceAnalytics);
router.get('/meal-usage', analyticsController.getMealAnalytics);

module.exports = router;
