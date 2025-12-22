const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const authGuard = require('../middleware/auth');
const { body, query, param } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

/**
 * @swagger
 * tags:
 *   name: Reservations
 *   description: Classroom reservation management
 */

/**
 * @swagger
 * /api/v1/reservations:
 *   post:
 *     summary: Create a classroom reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - classroomId
 *               - date
 *               - startTime
 *               - endTime
 *               - purpose
 *             properties:
 *               classroomId:
 *                 type: string
 *                 format: uuid
 *               date:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *                 format: time
 *               endTime:
 *                 type: string
 *                 format: time
 *               purpose:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reservation created successfully
 *       400:
 *         description: Validation error or conflict
 *       409:
 *         description: Time slot conflict
 */
router.post(
  '/',
  authGuard,
  [
    body('classroomId').notEmpty().isUUID().withMessage('Valid classroom ID is required'),
    body('date').notEmpty().isISO8601().toDate().withMessage('Valid date is required'),
    body('startTime').notEmpty().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required (HH:mm)'),
    body('endTime').notEmpty().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time is required (HH:mm)'),
    body('purpose').notEmpty().isLength({ min: 5 }).withMessage('Purpose must be at least 5 characters'),
    validateRequest
  ],
  reservationController.createReservation
);

/**
 * @swagger
 * /api/v1/reservations:
 *   get:
 *     summary: Get user's reservations
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, cancelled]
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of user's reservations
 */
router.get(
  '/',
  authGuard,
  [
    query('status').optional().isIn(['pending', 'approved', 'rejected', 'cancelled', 'all']),
    query('date').optional().isISO8601().toDate(),
    validateRequest
  ],
  reservationController.getMyReservations
);

/**
 * @swagger
 * /api/v1/reservations/all:
 *   get:
 *     summary: Get all reservations (admin only)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *       - in: query
 *         name: classroomId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of all reservations
 *       403:
 *         description: Forbidden - Admin only
 */
router.get(
  '/all',
  authGuard,
  [
    query('status').optional().isIn(['pending', 'approved', 'rejected', 'cancelled', 'all']),
    query('date').optional().isISO8601().toDate(),
    query('classroomId').optional().isUUID(),
    validateRequest
  ],
  reservationController.getAllReservations
);

/**
 * @swagger
 * /api/v1/reservations/{id}/approve:
 *   put:
 *     summary: Approve a reservation (admin only)
 *     tags: [Reservations]
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
 *         description: Reservation approved
 *       403:
 *         description: Forbidden - Admin only
 *       409:
 *         description: Conflict detected
 */
router.put(
  '/:id/approve',
  authGuard,
  [
    param('id').isUUID().withMessage('Valid reservation ID is required'),
    validateRequest
  ],
  reservationController.approveReservation
);

/**
 * @swagger
 * /api/v1/reservations/{id}/reject:
 *   put:
 *     summary: Reject a reservation (admin only)
 *     tags: [Reservations]
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rejectedReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reservation rejected
 *       403:
 *         description: Forbidden - Admin only
 */
router.put(
  '/:id/reject',
  authGuard,
  [
    param('id').isUUID().withMessage('Valid reservation ID is required'),
    body('rejectedReason').optional().isString(),
    validateRequest
  ],
  reservationController.rejectReservation
);

/**
 * @swagger
 * /api/v1/reservations/{id}:
 *   delete:
 *     summary: Cancel a reservation
 *     tags: [Reservations]
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
 *         description: Reservation cancelled
 *       403:
 *         description: Forbidden
 */
router.delete(
  '/:id',
  authGuard,
  [
    param('id').isUUID().withMessage('Valid reservation ID is required'),
    validateRequest
  ],
  reservationController.cancelReservation
);

module.exports = router;

