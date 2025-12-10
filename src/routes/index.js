const express = require('express');
const authRoutes = require('./authRoutes');
const departmentRoutes = require('./departmentRoutes');
const userRoutes = require('./userRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/departments', departmentRoutes);
router.use('/users', userRoutes);

module.exports = router;

