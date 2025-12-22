const stripe = require('../config/stripe');
const { Student, User } = require('../models');

const MINIMUM_TOPUP = 50; // 50 TL minimum

class PaymentService {
  /**
   * Create Stripe payment intent for wallet top-up
   * @param {string} studentId - User ID (student)
   * @param {number} amount - Amount in TL
   * @returns {Promise<Object>}
   */
  async createTopUpIntent(studentId, amount) {
    // Check if Stripe is configured
    if (!stripe) {
      throw new Error('Stripe payment service is not configured. Please contact administrator.');
    }

    // Validate minimum amount
    if (amount < MINIMUM_TOPUP) {
      throw new Error(`Minimum top-up amount is ${MINIMUM_TOPUP} TL`);
    }

    // Get student profile
    const student = await Student.findOne({
      where: { userId: studentId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName']
        }
      ]
    });

    if (!student) {
      throw new Error('Student profile not found');
    }

    // Create payment intent (Stripe uses smallest currency unit - kuruş for TRY)
    const amountInKurus = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInKurus,
      currency: 'try',
      metadata: {
        studentId: studentId,
        type: 'wallet_topup'
      },
      description: `Wallet top-up for ${student.user.firstName} ${student.user.lastName}`,
      receipt_email: student.user.email
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount,
      currency: 'TRY'
    };
  }

  /**
   * Retrieve payment intent details
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @returns {Promise<Object>}
   */
  async getPaymentIntent(paymentIntentId) {
    if (!stripe) {
      throw new Error('Stripe payment service is not configured. Please contact administrator.');
    }
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  }

  /**
   * Construct webhook event
   * @param {string} payload - Request body
   * @param {string} signature - Stripe signature header
   * @returns {Object}
   */
  constructWebhookEvent(payload, signature) {
    if (!stripe) {
      throw new Error('Stripe payment service is not configured. Please contact administrator.');
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}

module.exports = new PaymentService();

