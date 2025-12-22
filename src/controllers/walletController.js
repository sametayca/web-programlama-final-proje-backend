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
 * @desc    Add balance directly to wallet
 * @route   POST /api/v1/wallet/topup
 * @access  Private (Student only)
 */
exports.createTopUp = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { amount } = req.body;

    // Basic validation - just check if amount exists and is positive
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Geçerli bir tutar giriniz'
      });
    }

    // Get student
    const student = await Student.findOne({
      where: { userId: studentId }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Öğrenci profili bulunamadı'
      });
    }

    const balanceBefore = parseFloat(student.walletBalance || 0);
    const amountNum = parseFloat(amount);
    const balanceAfter = balanceBefore + amountNum;

    // Update balance
    await student.update({
      walletBalance: balanceAfter
    });

    // Try to create transaction record (don't fail if it errors)
    try {
      await Transaction.create({
        studentId: studentId,
        type: 'deposit',
        amount: amountNum,
        balanceBefore: balanceBefore,
        balanceAfter: balanceAfter,
        description: `Bakiye yükleme`,
        referenceId: `topup-${Date.now()}`,
        referenceType: 'direct'
      });
    } catch (txError) {
      // Log but don't fail the request
      logger.warn('Transaction record creation failed:', txError);
    }

    logger.info(`Wallet topped up: Student ${studentId}, Amount: ${amountNum} TL`);

    res.status(200).json({
      success: true,
      message: 'Bakiye başarıyla eklendi',
      data: {
        amount: amountNum,
        balanceBefore: balanceBefore,
        balanceAfter: balanceAfter,
        currency: 'TRY'
      }
    });
  } catch (error) {
    logger.error('Error in createTopUp:', error);
    res.status(500).json({
      success: false,
      error: 'Bakiye yükleme başarısız: ' + error.message
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
 * @desc    Add balance directly without Stripe
 * @route   POST /api/v1/wallet/topup/dev
 * @access  Private (Student only)
 */
exports.devTopUp = async (req, res) => {

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

    if (amount < 50) {
      return res.status(400).json({
        success: false,
        error: 'Minimum top-up amount is 50 TL'
      });
    }

    // Get student
    const student = await Student.findOne({
      where: { userId: studentId }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student profile not found'
      });
    }

    const balanceBefore = parseFloat(student.walletBalance);
    const balanceAfter = balanceBefore + amount;

    // Update balance
    await student.update({
      walletBalance: balanceAfter
    });

    // Create transaction record
    await Transaction.create({
      studentId: studentId,
      type: 'deposit',
      amount: amount,
      balanceBefore: balanceBefore,
      balanceAfter: balanceAfter,
      description: `Wallet top-up`,
      referenceId: `topup-${Date.now()}`,
      referenceType: 'direct'
    });

    logger.info(`Wallet topped up: Student ${studentId}, Amount: ${amount} TL`);

    res.status(200).json({
      success: true,
      message: 'Bakiye başarıyla eklendi',
      data: {
        amount: amount,
        balanceBefore: balanceBefore,
        balanceAfter: balanceAfter,
        currency: 'TRY'
      }
    });
  } catch (error) {
    logger.error('Error in devTopUp:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add balance'
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

