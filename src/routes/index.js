const express = require('express');
const authRoutes = require('./authRoutes');
const departmentRoutes = require('./departmentRoutes');
const userRoutes = require('./userRoutes');

// Part 2 Routes
const courseRoutes = require('./courseRoutes');
const sectionRoutes = require('./sectionRoutes');
const enrollmentRoutes = require('./enrollmentRoutes');
const gradeRoutes = require('./gradeRoutes');
const attendanceRoutes = require('./attendanceRoutes');

// Part 3 Routes - Meal Reservation System
const mealRoutes = require('./mealRoutes');
const walletRoutes = require('./walletRoutes');
const eventRoutes = require('./eventRoutes');
const schedulingRoutes = require('./schedulingRoutes');

const router = express.Router();

// Part 1 Routes (Legacy)
router.use('/auth', authRoutes);
router.use('/departments', departmentRoutes);
router.use('/users', userRoutes);

// Part 2 Routes (Versioned)
router.use('/v1/courses', courseRoutes);
router.use('/v1/sections', sectionRoutes);
router.use('/v1/enrollments', enrollmentRoutes);
router.use('/v1/grades', gradeRoutes);
router.use('/v1/attendance', attendanceRoutes);
router.use('/v1/announcements', require('./announcementRoutes'));

// Part 3 Routes - Meal Reservation System
router.use('/v1/meals', mealRoutes);
router.use('/v1/wallet', walletRoutes);
router.use('/v1/events', eventRoutes);
router.use('/v1/scheduling', schedulingRoutes);

// Part 3 Routes - Classroom Reservations
router.use('/v1/classrooms', require('./classroomRoutes'));
router.use('/v1/reservations', require('./reservationRoutes'));

module.exports = router;

