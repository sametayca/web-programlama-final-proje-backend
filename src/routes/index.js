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

module.exports = router;

