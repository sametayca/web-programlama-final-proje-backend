const paymentService = require('../services/paymentService');
const webhookService = require('../services/webhookService');
const { Student, Transaction } = require('../models');
const logger = require('../config/logger');
const { Op } = require('sequelize');

/**
 * @desc    Get wallet balance
 * @route   GET /api/v1/wallet/balance
 * @access  Private (Student only)
 */
exports.getBalance = async (req, res) => {
  try {
    const studentId = req.user.id;

    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students have wallet access'
      });
    }

    const student = await Student.findOne({
      where: { userId: studentId },
      attributes: ['id', 'walletBalance']
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        balance: parseFloat(student.walletBalance),
        currency: 'TRY'
      }
    });
  } catch (error) {
    logger.error('Error in getBalance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wallet balance'
    });
  }
};

/**
 * @desc    Create wallet top-up payment intent
 * @route   POST /api/v1/wallet/topup
 * @access  Private (Student only)
 */
exports.createTopUp = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { amount } = req.body;

    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can top-up wallet'
      });
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

    const paymentIntent = await paymentService.createTopUpIntent(studentId, amount);

    logger.info(`Payment intent created: ${paymentIntent.paymentIntentId} for student ${studentId}`);

    res.status(200).json({
      success: true,
      message: 'Payment intent created successfully',
      data: paymentIntent
    });
  } catch (error) {
    logger.error('Error in createTopUp:', error);

    const statusCode = error.message.includes('Minimum') ? 400 :
                      error.message.includes('not found') ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to create payment intent'
    });
  }
};

/**
 * @desc    Get wallet transaction history
 * @route   GET /api/v1/wallet/transactions
 * @access  Private (Student only)
 */
exports.getTransactions = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { type, startDate, endDate, limit = 50 } = req.query;

    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can view wallet transactions'
      });
    }

    const where = { studentId };

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const transactions = await Transaction.findAll({
      where,
      attributes: [
        'id',
        'type',
        'amount',
        'balanceBefore',
        'balanceAfter',
        'description',
        'createdAt'
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    logger.error('Error in getTransactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions'
    });
  }
};

/**
 * @desc    Handle Stripe webhook
 * @route   POST /api/v1/wallet/topup/webhook
 * @access  Public (Stripe only)
 */
exports.handleWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];

  try {
    // Construct event from raw body
    const event = paymentService.constructWebhookEvent(
      req.body,
      signature
    );

    logger.info(`Webhook received: ${event.type}`);

    // Handle event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await webhookService.handlePaymentSuccess(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await webhookService.handlePaymentFailed(event.data.object);
        break;

      default:
        logger.info(`Unhandled webhook event type: ${event.type}`);
    }

    // Return 200 to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Webhook error:', error);
    
    // Return 400 for signature verification errors
    if (error.message.includes('signature')) {
      return res.status(400).json({
        success: false,
        error: 'Webhook signature verification failed'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
};

