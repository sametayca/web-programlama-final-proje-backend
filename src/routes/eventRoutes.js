const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authGuard = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management and registration system
 */

/**
 * @swagger
 * /api/v1/events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *           enum: [seminar, workshop, conference, social, sports, cultural, other]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of events
 */
router.get(
  '/',
  [
    query('eventType')
      .optional()
      .isIn(['seminar', 'workshop', 'conference', 'social', 'sports', 'cultural', 'other'])
      .withMessage('Invalid event type'),
    query('startDate').optional().isDate().withMessage('Invalid start date'),
    query('endDate').optional().isDate().withMessage('Invalid end date'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validateRequest
  ],
  eventController.getEvents
);

/**
 * @swagger
 * /api/v1/events/my-registrations:
 *   get:
 *     summary: Get user's event registrations
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, cancelled]
 *       - in: query
 *         name: upcoming
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of user's registrations
 */
router.get('/my-registrations', authGuard, eventController.getMyRegistrations);

/**
 * @swagger
 * /api/v1/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Event details
 *       404:
 *         description: Event not found
 */
router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid event ID'),
    validateRequest
  ],
  eventController.getEventById
);

/**
 * @swagger
 * /api/v1/events:
 *   post:
 *     summary: Create new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - eventType
 *               - startDate
 *               - endDate
 *               - location
 *               - capacity
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               eventType:
 *                 type: string
 *                 enum: [seminar, workshop, conference, social, sports, cultural, other]
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *               organizer:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               requiresApproval:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Event created successfully
 *       403:
 *         description: Forbidden - Not authorized to create events
 */
router.post(
  '/',
  authGuard,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('eventType')
      .isIn(['seminar', 'workshop', 'conference', 'social', 'sports', 'cultural', 'other'])
      .withMessage('Invalid event type'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('location').notEmpty().withMessage('Location is required'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
    validateRequest
  ],
  eventController.createEvent
);

/**
 * @swagger
 * /api/v1/events/{id}:
 *   put:
 *     summary: Update event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               eventType:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               imageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Event not found
 */
router.put(
  '/:id',
  authGuard,
  [
    param('id').isUUID().withMessage('Invalid event ID'),
    validateRequest
  ],
  eventController.updateEvent
);

/**
 * @swagger
 * /api/v1/events/{id}:
 *   delete:
 *     summary: Delete event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Event not found
 */
router.delete(
  '/:id',
  authGuard,
  [
    param('id').isUUID().withMessage('Invalid event ID'),
    validateRequest
  ],
  eventController.deleteEvent
);

/**
 * @swagger
 * /api/v1/events/{id}/register:
 *   post:
 *     summary: Register for an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       201:
 *         description: Successfully registered
 *       409:
 *         description: Event is full or already registered
 *       404:
 *         description: Event not found
 */
router.post(
  '/:id/register',
  authGuard,
  [
    param('id').isUUID().withMessage('Invalid event ID'),
    validateRequest
  ],
  eventController.registerForEvent
);

/**
 * @swagger
 * /api/v1/events/{eventId}/registrations/{regId}/checkin:
 *   post:
 *     summary: Check-in to event using QR code
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: regId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qrCode
 *             properties:
 *               qrCode:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Check-in successful
 *       400:
 *         description: Invalid QR code or check-in conditions not met
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Registration not found
 *       409:
 *         description: Already checked in
 */
router.post(
  '/:eventId/registrations/:regId/checkin',
  authGuard,
  [
    param('eventId').isUUID().withMessage('Invalid event ID'),
    param('regId').isUUID().withMessage('Invalid registration ID'),
    body('qrCode').isUUID().withMessage('Valid QR code is required'),
    validateRequest
  ],
  eventController.checkInToEvent
);

/**
 * @swagger
 * /api/v1/events/{id}/registrations:
 *   get:
 *     summary: Get event registrations (for organizers)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of registrations
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Event not found
 */
router.get(
  '/:id/registrations',
  authGuard,
  [
    param('id').isUUID().withMessage('Invalid event ID'),
    validateRequest
  ],
  eventController.getEventRegistrations
);

module.exports = router;

