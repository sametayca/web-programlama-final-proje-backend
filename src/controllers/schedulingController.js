const schedulingService = require('../services/schedulingService');
const logger = require('../config/logger');

/**
 * @desc    Generate course schedule (CSP algorithm)
 * @route   POST /api/v1/scheduling/generate
 * @access  Private (Admin only)
 */
exports.generateSchedule = async (req, res) => {
  try {
    const { semester, year } = req.body;

    // Only admin can generate schedules
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can generate schedules'
      });
    }

    if (!semester || !year) {
      return res.status(400).json({
        success: false,
        error: 'Semester and year are required'
      });
    }

    logger.info(`Generating schedule for ${semester} ${year} by admin ${req.user.id}`);

    const result = await schedulingService.generateSchedule(semester, year);

    res.status(200).json({
      success: true,
      message: 'Schedule generated successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error in generateSchedule:', error);

    const statusCode = error.message.includes('No sections') ? 404 :
                      error.message.includes('No classrooms') ? 404 :
                      error.message.includes('Unable to generate') ? 409 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to generate schedule'
    });
  }
};

/**
 * @desc    Get my personal schedule
 * @route   GET /api/v1/scheduling/my-schedule
 * @access  Private (Student only)
 */
exports.getMySchedule = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { semester, year } = req.query;

    // Only students can view their schedule
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can view personal schedules'
      });
    }

    if (!semester || !year) {
      return res.status(400).json({
        success: false,
        error: 'Semester and year are required'
      });
    }

    const schedule = await schedulingService.getMySchedule(studentId, semester, parseInt(year));

    res.status(200).json({
      success: true,
      count: schedule.length,
      data: schedule
    });
  } catch (error) {
    logger.error('Error in getMySchedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schedule'
    });
  }
};

