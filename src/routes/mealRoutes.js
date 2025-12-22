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
/**
 * @swagger
 * /api/v1/meals/cafeterias:
 *   get:
 *     summary: Get all active cafeterias
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of cafeterias
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/cafeterias',
  authGuard,
  mealController.getCafeterias
);

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
 * /api/v1/meals/menus/{id}:
 *   get:
 *     summary: Get menu by ID
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
 *         description: Menu details
 *       404:
 *         description: Menu not found
 */
router.get(
  '/menus/:id',
  authGuard,
  [
    param('id').isUUID().withMessage('Valid menu ID is required'),
    validateRequest
  ],
  mealController.getMenuById
);

/**
 * @swagger
 * /api/v1/meals/menus:
 *   post:
 *     summary: Create a meal menu (Admin/Staff only)
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
 *               - cafeteriaId
 *               - mealType
 *               - menuDate
 *               - mainCourse
 *             properties:
 *               cafeteriaId:
 *                 type: string
 *                 format: uuid
 *               mealType:
 *                 type: string
 *                 enum: [breakfast, lunch, dinner]
 *               menuDate:
 *                 type: string
 *                 format: date
 *               mainCourse:
 *                 type: string
 *               sideDish:
 *                 type: string
 *               soup:
 *                 type: string
 *               salad:
 *                 type: string
 *               dessert:
 *                 type: string
 *               price:
 *                 type: number
 *               availableQuota:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Menu created successfully
 *       403:
 *         description: Forbidden - Not admin/staff
 */
router.post(
  '/menus',
  authGuard,
  [
    body('cafeteriaId').isUUID().withMessage('Valid cafeteria ID is required'),
    body('mealType').isIn(['breakfast', 'lunch', 'dinner']).withMessage('Valid meal type is required'),
    body('menuDate').isDate().withMessage('Valid menu date is required'),
    body('mainCourse').notEmpty().withMessage('Main course is required'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('availableQuota').optional().isInt({ min: 1 }).withMessage('Available quota must be at least 1'),
    validateRequest
  ],
  mealController.createMenu
);

/**
 * @swagger
 * /api/v1/meals/menus/{id}:
 *   put:
 *     summary: Update a meal menu (Admin/Staff only)
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
 *             properties:
 *               mainCourse:
 *                 type: string
 *               sideDish:
 *                 type: string
 *               soup:
 *                 type: string
 *               salad:
 *                 type: string
 *               dessert:
 *                 type: string
 *               price:
 *                 type: number
 *               availableQuota:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Menu updated successfully
 *       403:
 *         description: Forbidden - Not admin/staff
 *       404:
 *         description: Menu not found
 */
router.put(
  '/menus/:id',
  authGuard,
  [
    param('id').isUUID().withMessage('Valid menu ID is required'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('availableQuota').optional().isInt({ min: 1 }).withMessage('Available quota must be at least 1'),
    validateRequest
  ],
  mealController.updateMenu
);

/**
 * @swagger
 * /api/v1/meals/menus/{id}:
 *   delete:
 *     summary: Delete a meal menu (Admin/Staff only)
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
 *         description: Menu deleted successfully
 *       403:
 *         description: Forbidden - Not admin/staff
 *       404:
 *         description: Menu not found
 */
router.delete(
  '/menus/:id',
  authGuard,
  [
    param('id').isUUID().withMessage('Valid menu ID is required'),
    validateRequest
  ],
  mealController.deleteMenu
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

