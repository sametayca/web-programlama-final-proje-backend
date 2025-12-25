const eventService = require('../services/eventService');
const logger = require('../config/logger');

/**
 * @desc    Get all events
 * @route   GET /api/v1/events
 * @access  Public
 */
exports.getEvents = async (req, res) => {
  try {
    const { eventType, startDate, endDate, isActive, page, limit } = req.query;

    const filters = {};
    if (eventType) filters.eventType = eventType;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (page) filters.page = page;
    if (limit) filters.limit = limit;

    const result = await eventService.getEvents(filters);

    res.status(200).json({
      success: true,
      count: result.events.length,
      pagination: result.pagination,
      data: result.events
    });
  } catch (error) {
    logger.error('Error in getEvents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events'
    });
  }
};

/**
 * @desc    Get event by ID
 * @route   GET /api/v1/events/:id
 * @access  Public
 */
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await eventService.getEventById(id);

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    logger.error('Error in getEventById:', error);

    const statusCode = error.message.includes('not found') ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to fetch event'
    });
  }
};

/**
 * @desc    Create new event
 * @route   POST /api/v1/events
 * @access  Private (Faculty, Admin, Staff)
 */
exports.createEvent = async (req, res) => {
  try {
    const userId = req.user.id;

    // Only faculty, admin, or staff can create events
    if (!['faculty', 'admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Only faculty, admin, or staff can create events'
      });
    }

    const { eventType } = req.body;
    const academicTypes = ['academic', 'exam', 'holiday', 'registration', 'ceremony'];

    // Only admin can create academic events
    if (academicTypes.includes(eventType) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can create academic calendar events'
      });
    }

    const event = await eventService.createEvent(req.body, userId);

    logger.info(`Event created: ${event.id} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    logger.error('Error in createEvent:', error);

    const statusCode = error.message.includes('must be') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to create event'
    });
  }
};

/**
 * @desc    Update event
 * @route   PUT /api/v1/events/:id
 * @access  Private (Organizer only)
 */
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const event = await eventService.updateEvent(id, req.body, userId);

    logger.info(`Event updated: ${id} by user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    logger.error('Error in updateEvent:', error);

    const statusCode = error.message.includes('not found') ? 404 :
      error.message.includes('Not authorized') ? 403 :
        error.message.includes('must be') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to update event'
    });
  }
};

/**
 * @desc    Delete event
 * @route   DELETE /api/v1/events/:id
 * @access  Private (Organizer only)
 */
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await eventService.deleteEvent(id, userId);

    logger.info(`Event deleted: ${id} by user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deleteEvent:', error);

    const statusCode = error.message.includes('not found') ? 404 :
      error.message.includes('Not authorized') ? 403 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to delete event'
    });
  }
};

/**
 * @desc    Register for an event
 * @route   POST /api/v1/events/:id/register
 * @access  Private (All authenticated users)
 */
exports.registerForEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const registration = await eventService.registerForEvent(id, userId);

    logger.info(`User ${userId} registered for event ${id}`);

    res.status(201).json({
      success: true,
      message: 'Successfully registered for event',
      data: registration
    });
  } catch (error) {
    logger.error('Error in registerForEvent:', error);

    const statusCode = error.message.includes('not found') ? 404 :
      error.message.includes('full') ? 409 :
        error.message.includes('already registered') ? 409 :
          error.message.includes('already started') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to register for event'
    });
  }
};

/**
 * @desc    Check-in to event
 * @route   POST /api/v1/events/:eventId/registrations/:regId/checkin
 * @access  Private (Staff, Admin, or Organizer)
 */
exports.checkInToEvent = async (req, res) => {
  try {
    const { eventId, regId } = req.params;
    const { qrCode } = req.body;

    // Only staff, admin can check-in
    if (!['staff', 'admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Only staff, admin, or faculty can perform check-in'
      });
    }

    if (!qrCode) {
      return res.status(400).json({
        success: false,
        error: 'QR code is required'
      });
    }

    const registration = await eventService.checkInToEvent(eventId, regId, qrCode);

    logger.info(`Check-in successful: Registration ${regId} for event ${eventId}`);

    res.status(200).json({
      success: true,
      message: 'Check-in successful',
      data: {
        registrationId: registration.id,
        userId: registration.userId,
        userName: `${registration.user.firstName} ${registration.user.lastName}`,
        eventTitle: registration.event.title,
        checkedInAt: registration.checkedInAt
      }
    });
  } catch (error) {
    logger.error('Error in checkInToEvent:', error);

    const statusCode = error.message.includes('not found') ? 404 :
      error.message.includes('invalid QR') ? 400 :
        error.message.includes('Already checked in') ? 409 :
          error.message.includes('not started') ? 400 :
            error.message.includes('ended') ? 400 :
              error.message.includes('status') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to check-in'
    });
  }
};

/**
 * @desc    Get user's event registrations
 * @route   GET /api/v1/events/my-registrations
 * @access  Private (Authenticated users)
 */
exports.getMyRegistrations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, upcoming } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (upcoming) filters.upcoming = upcoming === 'true';

    const registrations = await eventService.getUserRegistrations(userId, filters);

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    logger.error('Error in getMyRegistrations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch registrations'
    });
  }
};

/**
 * @desc    Get event registrations (for organizers)
 * @route   GET /api/v1/events/:id/registrations
 * @access  Private (Organizer only)
 */
exports.getEventRegistrations = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const registrations = await eventService.getEventRegistrations(id, userId);

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    logger.error('Error in getEventRegistrations:', error);

    const statusCode = error.message.includes('not found') ? 404 :
      error.message.includes('Not authorized') ? 403 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to fetch registrations'
    });
  }
};

/**
 * @desc    Cancel event registration
 * @route   DELETE /api/v1/events/:eventId/registrations/:regId
 * @access  Private (Registration owner only)
 */
exports.cancelRegistration = async (req, res) => {
  try {
    const { eventId, regId } = req.params;
    const userId = req.user.id;

    const registration = await eventService.cancelRegistration(eventId, regId, userId);

    logger.info(`Registration ${regId} cancelled by user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully',
      data: registration
    });
  } catch (error) {
    logger.error('Error in cancelRegistration:', error);

    const statusCode = error.message.includes('not found') ? 404 :
      error.message.includes('already started') ? 400 :
        error.message.includes('checked in') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to cancel registration'
    });
  }
};

