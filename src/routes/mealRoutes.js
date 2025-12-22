const express = require('express');
const router = express.Router();
const mealController = require('../controllers/mealController');
const authGuard = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

/**
 * @swagger
 * tags:
 *   name: Meals
 *   description: Meal reservation system
 */

/**
 * @swagger
 * /api/v1/meals/menus:
 *   get:
 *     summary: Get available meal menus
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (YYYY-MM-DD)
 *       - in: query
 *         name: mealType
 *         schema:
 *           type: string
 *           enum: [breakfast, lunch, dinner]
 *         description: Filter by meal type
 *       - in: query
 *         name: cafeteriaId
 *         schema:
 *           type: string
 *         description: Filter by cafeteria ID
 *     responses:
 *       200:
 *         description: List of available menus
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/menus',
  authGuard,
  [
    query('date').optional().isDate().withMessage('Invalid date format (use YYYY-MM-DD)'),
    query('mealType').optional().isIn(['breakfast', 'lunch', 'dinner']).withMessage('Invalid meal type'),
    query('cafeteriaId').optional().isUUID().withMessage('Invalid cafeteria ID'),
    validateRequest
  ],
  mealController.getMenus
);

/**
 * @swagger
 * /api/v1/meals/reservations:
 *   get:
 *     summary: Get student's meal reservations
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, used, cancelled, expired]
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
 *     responses:
 *       200:
 *         description: List of reservations
 *       403:
 *         description: Forbidden - Not a student
 */
router.get(
  '/reservations',
  authGuard,
  [
    query('status').optional().isIn(['pending', 'used', 'cancelled', 'expired']).withMessage('Invalid status'),
    query('startDate').optional().isDate().withMessage('Invalid start date'),
    query('endDate').optional().isDate().withMessage('Invalid end date'),
    validateRequest
  ],
  mealController.getMyReservations
);

/**
 * @swagger
 * /api/v1/meals/reservations:
 *   post:
 *     summary: Create a meal reservation
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - menuId
 *             properties:
 *               menuId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Reservation created successfully
 *       400:
 *         description: Bad request - validation error or business rule violation
 *       403:
 *         description: Forbidden - Not a student
 *       409:
 *         description: Conflict - already reserved or no quota
 */
router.post(
  '/reservations',
  authGuard,
  [
    body('menuId').notEmpty().isUUID().withMessage('Valid menu ID is required'),
    validateRequest
  ],
  mealController.createReservation
);

/**
 * @swagger
 * /api/v1/meals/reservations/{id}:
 *   delete:
 *     summary: Cancel a meal reservation
 *     tags: [Meals]
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
 *         description: Reservation cancelled successfully
 *       400:
 *         description: Cannot cancel reservation
 *       403:
 *         description: Forbidden - Not a student
 *       404:
 *         description: Reservation not found
 */
router.delete(
  '/reservations/:id',
  authGuard,
  [
    param('id').isUUID().withMessage('Valid reservation ID is required'),
    validateRequest
  ],
  mealController.cancelReservation
);

/**
 * @swagger
 * /api/v1/meals/reservations/{id}/use:
 *   post:
 *     summary: Use a meal reservation (scan QR code)
 *     tags: [Meals]
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
 *             required:
 *               - qrCode
 *             properties:
 *               qrCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Meal used successfully (payment processed for non-scholarship)
 *       400:
 *         description: Invalid QR code or business rule violation
 *       403:
 *         description: Forbidden - Not a staff member
 *       404:
 *         description: Reservation not found
 */
router.post(
  '/reservations/:id/use',
  authGuard,
  [
    param('id').isUUID().withMessage('Valid reservation ID is required'),
    body('qrCode').notEmpty().isUUID().withMessage('Valid QR code is required'),
    validateRequest
  ],
  mealController.useReservation
);

/**
 * @swagger
 * /api/v1/meals/transactions:
 *   get:
 *     summary: Get student's transaction history
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [deposit, withdrawal, meal_payment, refund]
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
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Transaction history
 *       403:
 *         description: Forbidden - Not a student
 */
router.get(
  '/transactions',
  authGuard,
  [
    query('type').optional().isIn(['deposit', 'withdrawal', 'meal_payment', 'refund']).withMessage('Invalid transaction type'),
    query('startDate').optional().isDate().withMessage('Invalid start date'),
    query('endDate').optional().isDate().withMessage('Invalid end date'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validateRequest
  ],
  mealController.getMyTransactions
);

module.exports = router;

