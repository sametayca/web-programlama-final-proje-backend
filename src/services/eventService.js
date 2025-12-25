const { Event, EventRegistration, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const notificationService = require('./notificationService');
const logger = require('../config/logger');

class EventService {
  /**
   * Get all events with filters and pagination
   * @param {Object} filters - { eventType, startDate, endDate, isActive, page, limit }
   * @returns {Promise<Object>}
   */
  async getEvents(filters = {}) {
    const {
      eventType,
      startDate,
      endDate,
      isActive = true,
      page = 1,
      limit = 20
    } = filters;

    const where = { isActive };

    if (eventType) {
      where.eventType = eventType;
    }

    // Date filtering
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) {
        where.startDate[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.startDate[Op.lte] = new Date(endDate);
      }
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Event.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'organizerUser',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['startDate', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      events: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Get event by ID
   * @param {string} eventId - Event ID
   * @returns {Promise<Object>}
   */
  async getEventById(eventId) {
    const event = await Event.findByPk(eventId, {
      include: [
        {
          model: User,
          as: 'organizerUser',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    if (!event) {
      throw new Error('Event not found');
    }

    return event;
  }

  /**
   * Create a new event
   * @param {Object} eventData - Event details
   * @param {string} userId - Creator user ID
   * @returns {Promise<Object>}
   */
  async createEvent(eventData, userId) {
    const {
      title,
      description,
      eventType,
      startDate,
      endDate,
      location,
      capacity,
      organizer,
      imageUrl,
      requiresApproval,
      priority // Added priority
    } = eventData;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      throw new Error('End date must be after start date');
    }

    if (start < new Date()) {
      throw new Error('Start date must be in the future');
    }

    const event = await Event.create({
      title,
      description,
      eventType,
      startDate: start,
      endDate: end,
      location,
      capacity: capacity || 50,
      organizer,
      organizerId: userId,
      imageUrl,
      requiresApproval: requiresApproval || false,
      isActive: true,
      registeredCount: 0,
      priority: priority || 'normal' // Added priority
    });

    return event;
  }

  /**
   * Update event
   * @param {string} eventId - Event ID
   * @param {Object} updates - Fields to update
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>}
   */
  async updateEvent(eventId, updates, userId) {
    const event = await Event.findByPk(eventId);

    if (!event) {
      throw new Error('Event not found');
    }

    // Check authorization (organizer or admin)
    if (event.organizerId !== userId) {
      throw new Error('Not authorized to update this event');
    }

    // Validate dates if being updated
    if (updates.startDate || updates.endDate) {
      const start = updates.startDate ? new Date(updates.startDate) : event.startDate;
      const end = updates.endDate ? new Date(updates.endDate) : event.endDate;

      if (start >= end) {
        throw new Error('End date must be after start date');
      }
    }

    await event.update(updates);

    return event;
  }

  /**
   * Delete event
   * @param {string} eventId - Event ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<void>}
   */
  async deleteEvent(eventId, userId) {
    const event = await Event.findByPk(eventId);

    if (!event) {
      throw new Error('Event not found');
    }

    // Check authorization
    if (event.organizerId !== userId) {
      throw new Error('Not authorized to delete this event');
    }

    // Soft delete (set isActive to false)
    await event.update({ isActive: false });
  }

  /**
   * Register user for an event
   * @param {string} eventId - Event ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  async registerForEvent(eventId, userId) {
    const t = await sequelize.transaction();

    try {
      // Get event with lock
      const event = await Event.findByPk(eventId, {
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!event || !event.isActive) {
        throw new Error('Event not found or inactive');
      }

      // Check if event has already started
      if (new Date() >= new Date(event.startDate)) {
        throw new Error('Cannot register for an event that has already started');
      }

      // Check capacity
      if (event.registeredCount >= event.capacity) {
        throw new Error('Event is full');
      }

      // Check if already registered
      const existingRegistration = await EventRegistration.findOne({
        where: { eventId, userId },
        transaction: t
      });

      if (existingRegistration) {
        throw new Error('You are already registered for this event');
      }

      // Generate QR code
      const qrCode = uuidv4();

      // Create registration
      const registration = await EventRegistration.create(
        {
          eventId,
          userId,
          qrCode,
          status: event.requiresApproval ? 'pending' : 'approved',
          checkedIn: false,
          registeredAt: new Date()
        },
        { transaction: t }
      );

      // Atomic increment of registered count (only if auto-approved)
      if (!event.requiresApproval) {
        await event.increment('registeredCount', { transaction: t });
      }

      await t.commit();

      // Return registration with event details
      const registrationWithDetails = await EventRegistration.findByPk(registration.id, {
        include: [
          {
            model: Event,
            as: 'event',
            attributes: ['id', 'title', 'startDate', 'endDate', 'location']
          }
        ]
      });

      return registrationWithDetails;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Check-in user to event using QR code
   * @param {string} eventId - Event ID
   * @param {string} registrationId - Registration ID
   * @param {string} qrCode - QR code to verify
   * @returns {Promise<Object>}
   */
  async checkInToEvent(eventId, registrationId, qrCode) {
    const t = await sequelize.transaction();

    try {
      const registration = await EventRegistration.findOne({
        where: {
          id: registrationId,
          eventId,
          qrCode
        },
        include: [
          {
            model: Event,
            as: 'event'
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ],
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!registration) {
        throw new Error('Registration not found or invalid QR code');
      }

      // Check if registration is approved
      if (registration.status !== 'approved') {
        throw new Error(`Registration status is ${registration.status}. Only approved registrations can check-in.`);
      }

      // Check if already checked in
      if (registration.checkedIn) {
        throw new Error('Already checked in at ' + registration.checkedInAt.toLocaleString());
      }

      // Check if event is happening today
      const now = new Date();
      const eventStart = new Date(registration.event.startDate);
      const eventEnd = new Date(registration.event.endDate);

      if (now < eventStart) {
        throw new Error('Event has not started yet');
      }

      if (now > eventEnd) {
        throw new Error('Event has already ended');
      }

      // Mark as checked in
      await registration.update(
        {
          checkedIn: true,
          checkedInAt: new Date()
        },
        { transaction: t }
      );

      await t.commit();

      return registration;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Get user's event registrations
   * @param {string} userId - User ID
   * @param {Object} filters - { status, upcoming }
   * @returns {Promise<Array>}
   */
  async getUserRegistrations(userId, filters = {}) {
    const where = { userId };

    if (filters.status) {
      where.status = filters.status;
    }

    const include = [
      {
        model: Event,
        as: 'event',
        where: { isActive: true }
      }
    ];

    // Filter for upcoming events
    if (filters.upcoming) {
      include[0].where.startDate = {
        [Op.gte]: new Date()
      };
    }

    const registrations = await EventRegistration.findAll({
      where,
      include,
      order: [[{ model: Event, as: 'event' }, 'startDate', 'ASC']]
    });

    return registrations;
  }

  /**
   * Get event registrations (for organizers)
   * @param {string} eventId - Event ID
   * @param {string} organizerId - Organizer user ID
   * @returns {Promise<Array>}
   */
  async getEventRegistrations(eventId, organizerId) {
    const event = await Event.findByPk(eventId);

    if (!event) {
      throw new Error('Event not found');
    }

    // Check authorization
    if (event.organizerId !== organizerId) {
      throw new Error('Not authorized to view registrations for this event');
    }

    const registrations = await EventRegistration.findAll({
      where: { eventId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role']
        }
      ],
      order: [['registeredAt', 'DESC']]
    });

    return registrations;
  }

  /**
   * Cancel event registration
   * @param {string} eventId - Event ID
   * @param {string} registrationId - Registration ID
   * @param {string} userId - User ID (must be the owner)
   * @returns {Promise<Object>}
   */
  async cancelRegistration(eventId, registrationId, userId) {
    const t = await sequelize.transaction();

    try {
      // Get registration with event
      const registration = await EventRegistration.findOne({
        where: {
          id: registrationId,
          eventId,
          userId
        },
        include: [
          {
            model: Event,
            as: 'event',
            transaction: t,
            lock: t.LOCK.UPDATE
          }
        ],
        transaction: t
      });

      if (!registration) {
        throw new Error('Registration not found');
      }

      // Check if already checked in
      if (registration.checkedIn) {
        throw new Error('Cannot cancel registration that has already been checked in');
      }

      // Check if event has started
      if (new Date() >= new Date(registration.event.startDate)) {
        throw new Error('Cannot cancel registration for an event that has already started');
      }

      // Update registration status
      await registration.update({ status: 'cancelled' }, { transaction: t });

      // Decrement registered count if it was approved
      if (registration.status === 'approved') {
        await registration.event.decrement('registeredCount', { transaction: t });
      }

      await t.commit();

      // Get user and event info for notification
      const registrationWithDetails = await EventRegistration.findByPk(registration.id, {
        include: [
          {
            model: Event,
            as: 'event',
            attributes: ['id', 'title', 'startDate', 'endDate', 'location']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ]
      });

      // Send cancellation notification (non-blocking)
      if (registrationWithDetails.user && registrationWithDetails.event) {
        const userName = `${registrationWithDetails.user.firstName} ${registrationWithDetails.user.lastName}`;
        notificationService.sendEventRegistrationCancellation(
          registrationWithDetails,
          registrationWithDetails.event,
          registrationWithDetails.user.email,
          userName
        ).catch(err => logger.error('Failed to send cancellation email:', err));
      }

      return registrationWithDetails;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

module.exports = new EventService();

