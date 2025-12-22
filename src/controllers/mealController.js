const mealService = require('../services/mealService');
const logger = require('../config/logger');

/**
 * @desc    Get cafeterias list
 * @route   GET /api/v1/meals/cafeterias
 * @access  Private
 */
exports.getCafeterias = async (req, res, next) => {
  try {
    const cafeterias = await mealService.getCafeterias();
    
    res.status(200).json({
      success: true,
      count: cafeterias.length,
      data: cafeterias
    });
  } catch (error) {
    logger.error('Error in getCafeterias controller:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch cafeterias'
    });
  }
};

/**
 * @desc    Get menu by ID
 * @route   GET /api/v1/meals/menus/:id
 * @access  Private
 */
exports.getMenuById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const menu = await mealService.getMenuById(id);
    
    res.status(200).json({
      success: true,
      data: menu
    });
  } catch (error) {
    logger.error('Error in getMenuById controller:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to fetch menu'
    });
  }
};

/**
 * @desc    Create a meal menu
 * @route   POST /api/v1/meals/menus
 * @access  Private (Admin, Staff)
 */
exports.createMenu = async (req, res, next) => {
  try {
    // Check permissions
    if (!['admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Only admins and staff can create menus'
      });
    }

    const menu = await mealService.createMenu(req.body);
    
    logger.info(`Meal menu created: ${menu.id} by ${req.user.role} ${req.user.id}`);
    
    res.status(201).json({
      success: true,
      message: 'Menu created successfully',
      data: menu
    });
  } catch (error) {
    logger.error('Error in createMenu controller:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create menu'
    });
  }
};

/**
 * @desc    Update a meal menu
 * @route   PUT /api/v1/meals/menus/:id
 * @access  Private (Admin, Staff)
 */
exports.updateMenu = async (req, res, next) => {
  try {
    // Check permissions
    if (!['admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Only admins and staff can update menus'
      });
    }

    const { id } = req.params;
    const menu = await mealService.updateMenu(id, req.body);
    
    logger.info(`Meal menu updated: ${id} by ${req.user.role} ${req.user.id}`);
    
    res.status(200).json({
      success: true,
      message: 'Menu updated successfully',
      data: menu
    });
  } catch (error) {
    logger.error('Error in updateMenu controller:', error);
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('reservations') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to update menu'
    });
  }
};

/**
 * @desc    Delete a meal menu
 * @route   DELETE /api/v1/meals/menus/:id
 * @access  Private (Admin, Staff)
 */
exports.deleteMenu = async (req, res, next) => {
  try {
    // Check permissions
    if (!['admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Only admins and staff can delete menus'
      });
    }

    const { id } = req.params;
    await mealService.deleteMenu(id);
    
    logger.info(`Meal menu deleted: ${id} by ${req.user.role} ${req.user.id}`);
    
    res.status(200).json({
      success: true,
      message: 'Menu deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deleteMenu controller:', error);
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('reservations') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to delete menu'
    });
  }
};

/**
 * @desc    Get available meal menus
 * @route   GET /api/v1/meals/menus
 * @access  Private (Student, Faculty, Staff, Admin)
 */
exports.getMenus = async (req, res, next) => {
  try {
    const { date, mealType, cafeteriaId } = req.query;

    const filters = {};
    if (date) filters.date = date;
    if (mealType) filters.mealType = mealType;
    if (cafeteriaId) filters.cafeteriaId = cafeteriaId;

    const menus = await mealService.getMenus(filters);

    res.status(200).json({
      success: true,
      count: menus.length,
      data: menus
    });
  } catch (error) {
    logger.error('Error in getMenus controller:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch menus'
    });
  }
};

/**
 * @desc    Create a meal reservation
 * @route   POST /api/v1/meals/reservations
 * @access  Private (Student only)
 */
exports.createReservation = async (req, res, next) => {
  try {
    const { menuId } = req.body;
    const studentId = req.user.id;

    // Verify user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can make meal reservations'
      });
    }

    if (!menuId) {
      return res.status(400).json({
        success: false,
        error: 'Menu ID is required'
      });
    }

    const reservation = await mealService.createReservation(studentId, menuId);

    logger.info(`Meal reservation created: ${reservation.id} by student ${studentId}`);

    res.status(201).json({
      success: true,
      message: 'Meal reservation created successfully',
      data: reservation
    });
  } catch (error) {
    logger.error('Error in createReservation controller:', error);
    
    // Handle specific business rule errors
    const statusCode = error.message.includes('not found') ? 404 :
                      error.message.includes('Insufficient') ? 400 :
                      error.message.includes('already reserved') ? 409 :
                      error.message.includes('maximum') ? 400 :
                      error.message.includes('No available') ? 409 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to create reservation'
    });
  }
};

/**
 * @desc    Cancel a meal reservation
 * @route   DELETE /api/v1/meals/reservations/:id
 * @access  Private (Student only - own reservations)
 */
exports.cancelReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    // Verify user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can cancel meal reservations'
      });
    }

    const reservation = await mealService.cancelReservation(id, studentId);

    logger.info(`Meal reservation cancelled: ${id} by student ${studentId}`);

    res.status(200).json({
      success: true,
      message: 'Meal reservation cancelled successfully',
      data: reservation
    });
  } catch (error) {
    logger.error('Error in cancelReservation controller:', error);

    const statusCode = error.message.includes('not found') ? 404 :
                      error.message.includes('Cannot cancel') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to cancel reservation'
    });
  }
};

/**
 * @desc    Use a meal reservation (scan QR code)
 * @route   POST /api/v1/meals/reservations/:id/use
 * @access  Private (Staff, Admin - cafeteria workers)
 */
exports.useReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { qrCode } = req.body;

    // Verify user is staff or admin
    if (!['staff', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Only cafeteria staff can process meal usage'
      });
    }

    if (!qrCode) {
      return res.status(400).json({
        success: false,
        error: 'QR code is required'
      });
    }

    const reservation = await mealService.useReservation(id, qrCode);

    logger.info(`Meal reservation used: ${id} - QR: ${qrCode}`);

    res.status(200).json({
      success: true,
      message: 'Meal reservation processed successfully',
      data: reservation
    });
  } catch (error) {
    logger.error('Error in useReservation controller:', error);

    const statusCode = error.message.includes('not found') ? 404 :
                      error.message.includes('invalid QR') ? 400 :
                      error.message.includes('Insufficient') ? 400 :
                      error.message.includes('not valid') ? 400 :
                      error.message.includes('Cannot use') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to process meal usage'
    });
  }
};

/**
 * @desc    Get student's meal reservations
 * @route   GET /api/v1/meals/reservations
 * @access  Private (Student only - own reservations)
 */
exports.getMyReservations = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { status, startDate, endDate } = req.query;

    // Verify user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can view meal reservations'
      });
    }

    const filters = {};
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const reservations = await mealService.getStudentReservations(studentId, filters);

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations
    });
  } catch (error) {
    logger.error('Error in getMyReservations controller:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch reservations'
    });
  }
};

/**
 * @desc    Get student's transaction history
 * @route   GET /api/v1/meals/transactions
 * @access  Private (Student only - own transactions)
 */
exports.getMyTransactions = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { type, startDate, endDate, limit } = req.query;

    // Verify user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can view transaction history'
      });
    }

    const filters = {};
    if (type) filters.type = type;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (limit) filters.limit = parseInt(limit);

    const transactions = await mealService.getTransactionHistory(studentId, filters);

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    logger.error('Error in getMyTransactions controller:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch transaction history'
    });
  }
};

