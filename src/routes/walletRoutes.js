const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const authGuard = require('../middleware/auth');
const { body, query } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Student wallet and payment management
 */

/**
 * @swagger
 * /api/v1/wallet/balance:
 *   get:
 *     summary: Get wallet balance
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     balance:
 *                       type: number
 *                       example: 150.00
 *                     currency:
 *                       type: string
 *                       example: TRY
 *       403:
 *         description: Forbidden - Not a student
 */
router.get('/balance', authGuard, walletController.getBalance);

/**
 * @swagger
 * /api/v1/wallet/topup:
 *   post:
 *     summary: Create wallet top-up payment intent
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 50
 *                 example: 100
 *                 description: Amount to top-up in TL (minimum 50 TL)
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     clientSecret:
 *                       type: string
 *                       description: Stripe client secret for frontend
 *                     paymentIntentId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     currency:
 *                       type: string
 *       400:
 *         description: Invalid amount or minimum not met
 *       403:
 *         description: Forbidden - Not a student
 */
router.post(
  '/topup',
  authGuard,
  [
    body('amount')
      .isNumeric()
      .withMessage('Amount must be a number')
      .custom(value => value >= 50)
      .withMessage('Minimum top-up amount is 50 TL'),
    validateRequest
  ],
  walletController.createTopUp
);

/**
 * @swagger
 * /api/v1/wallet/transactions:
 *   get:
 *     summary: Get wallet transaction history
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [deposit, withdrawal, meal_payment, refund]
 *         description: Filter by transaction type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date (YYYY-MM-DD)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Number of records to return
 *     responses:
 *       200:
 *         description: Transaction history retrieved successfully
 *       403:
 *         description: Forbidden - Not a student
 */
router.get(
  '/transactions',
  authGuard,
  [
    query('type')
      .optional()
      .isIn(['deposit', 'withdrawal', 'meal_payment', 'refund'])
      .withMessage('Invalid transaction type'),
    query('startDate')
      .optional()
      .isDate()
      .withMessage('Invalid start date format'),
    query('endDate')
      .optional()
      .isDate()
      .withMessage('Invalid end date format'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    validateRequest
  ],
  walletController.getTransactions
);

/**
 * @swagger
 * /api/v1/wallet/topup/webhook:
 *   post:
 *     summary: Stripe webhook endpoint
 *     tags: [Wallet]
 *     description: Handles Stripe webhook events (payment success/failure)
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid signature
 */
router.post('/topup/webhook', walletController.handleWebhook);

module.exports = router;

