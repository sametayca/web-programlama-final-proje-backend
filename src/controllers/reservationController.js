const { ClassroomReservation, Classroom, User } = require('../models');
const logger = require('../config/logger');
const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');

/**
 * @desc    Create a classroom reservation
 * @route   POST /api/v1/reservations
 * @access  Private
 */
exports.createReservation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { classroomId, date, startTime, endTime, purpose } = req.body;

    // Validation
    if (!classroomId || !date || !startTime || !endTime || !purpose) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Check if classroom exists
    const classroom = await Classroom.findOne({
      where: { id: classroomId, isActive: true }
    });

    if (!classroom) {
      return res.status(404).json({
        success: false,
        error: 'Classroom not found'
      });
    }

    // Validate time order
    if (endTime <= startTime) {
      return res.status(400).json({
        success: false,
        error: 'End time must be after start time'
      });
    }

    // Check for conflicts (same classroom, same date, overlapping time)
    const conflictingReservation = await ClassroomReservation.findOne({
      where: {
        classroomId,
        date,
        status: {
          [Op.in]: ['pending', 'approved']
        },
        [Op.or]: [
          {
            // New reservation starts during existing reservation
            startTime: {
              [Op.lte]: startTime
            },
            endTime: {
              [Op.gt]: startTime
            }
          },
          {
            // New reservation ends during existing reservation
            startTime: {
              [Op.lt]: endTime
            },
            endTime: {
              [Op.gte]: endTime
            }
          },
          {
            // New reservation completely contains existing reservation
            startTime: {
              [Op.gte]: startTime
            },
            endTime: {
              [Op.lte]: endTime
            }
          }
        ]
      }
    });

    if (conflictingReservation) {
      return res.status(409).json({
        success: false,
        error: 'This time slot is already reserved'
      });
    }

    // Create reservation
    const reservation = await ClassroomReservation.create({
      userId,
      classroomId,
      date,
      startTime,
      endTime,
      purpose,
      status: 'pending'
    });

    // Fetch with relations
    const reservationWithDetails = await ClassroomReservation.findByPk(reservation.id, {
      include: [
        {
          model: Classroom,
          as: 'classroom',
          attributes: ['id', 'building', 'roomNumber', 'capacity']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    logger.info(`Reservation created: ${reservation.id} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      data: reservationWithDetails
    });
  } catch (error) {
    logger.error('Error in createReservation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create reservation'
    });
  }
};

/**
 * @desc    Get user's reservations
 * @route   GET /api/v1/reservations
 * @access  Private
 */
exports.getMyReservations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, date } = req.query;

    const where = { userId };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (date) {
      where.date = date;
    }

    const reservations = await ClassroomReservation.findAll({
      where,
      include: [
        {
          model: Classroom,
          as: 'classroom',
          attributes: ['id', 'building', 'roomNumber', 'capacity']
        }
      ],
      order: [['date', 'DESC'], ['startTime', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations
    });
  } catch (error) {
    logger.error('Error in getMyReservations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reservations'
    });
  }
};

/**
 * @desc    Get all reservations (admin only)
 * @route   GET /api/v1/reservations/all
 * @access  Private (Admin only)
 */
exports.getAllReservations = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can view all reservations'
      });
    }

    const { status, date, classroomId } = req.query;

    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (date) {
      where.date = date;
    }

    if (classroomId) {
      where.classroomId = classroomId;
    }

    const reservations = await ClassroomReservation.findAll({
      where,
      include: [
        {
          model: Classroom,
          as: 'classroom',
          attributes: ['id', 'building', 'roomNumber', 'capacity']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['date', 'DESC'], ['startTime', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations
    });
  } catch (error) {
    logger.error('Error in getAllReservations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reservations'
    });
  }
};

/**
 * @desc    Approve a reservation (admin only)
 * @route   PUT /api/v1/reservations/:id/approve
 * @access  Private (Admin only)
 */
exports.approveReservation = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can approve reservations'
      });
    }

    const { id } = req.params;

    const reservation = await ClassroomReservation.findByPk(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Reservation not found'
      });
    }

    if (reservation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Reservation is already ${reservation.status}`
      });
    }

    // Check for conflicts before approving
    const conflictingReservation = await ClassroomReservation.findOne({
      where: {
        classroomId: reservation.classroomId,
        date: reservation.date,
        id: {
          [Op.ne]: id
        },
        status: 'approved',
        [Op.or]: [
          {
            startTime: {
              [Op.lte]: reservation.startTime
            },
            endTime: {
              [Op.gt]: reservation.startTime
            }
          },
          {
            startTime: {
              [Op.lt]: reservation.endTime
            },
            endTime: {
              [Op.gte]: reservation.endTime
            }
          }
        ]
      }
    });

    if (conflictingReservation) {
      return res.status(409).json({
        success: false,
        error: 'Cannot approve: conflicting reservation exists'
      });
    }

    await reservation.update({ status: 'approved' });

    logger.info(`Reservation ${id} approved by admin ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Reservation approved successfully',
      data: reservation
    });
  } catch (error) {
    logger.error('Error in approveReservation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve reservation'
    });
  }
};

/**
 * @desc    Reject a reservation (admin only)
 * @route   PUT /api/v1/reservations/:id/reject
 * @access  Private (Admin only)
 */
exports.rejectReservation = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can reject reservations'
      });
    }

    const { id } = req.params;
    const { rejectedReason } = req.body;

    const reservation = await ClassroomReservation.findByPk(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Reservation not found'
      });
    }

    if (reservation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Reservation is already ${reservation.status}`
      });
    }

    await reservation.update({
      status: 'rejected',
      rejectedReason: rejectedReason || 'No reason provided'
    });

    logger.info(`Reservation ${id} rejected by admin ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Reservation rejected successfully',
      data: reservation
    });
  } catch (error) {
    logger.error('Error in rejectReservation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject reservation'
    });
  }
};

/**
 * @desc    Cancel a reservation
 * @route   DELETE /api/v1/reservations/:id
 * @access  Private
 */
exports.cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const reservation = await ClassroomReservation.findByPk(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Reservation not found'
      });
    }

    // Users can only cancel their own reservations, admins can cancel any
    if (reservation.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You can only cancel your own reservations'
      });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Reservation is already cancelled'
      });
    }

    await reservation.update({ status: 'cancelled' });

    logger.info(`Reservation ${id} cancelled by user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Reservation cancelled successfully'
    });
  } catch (error) {
    logger.error('Error in cancelReservation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel reservation'
    });
  }
};

