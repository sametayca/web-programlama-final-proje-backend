const { Student, Transaction, sequelize } = require('../models');
const logger = require('../config/logger');
const nodemailer = require('nodemailer');

class WebhookService {
  /**
   * Handle successful payment
   * @param {Object} paymentIntent - Stripe payment intent object
   * @returns {Promise<Object>}
   */
  async handlePaymentSuccess(paymentIntent) {
    const t = await sequelize.transaction();

    try {
      const { studentId } = paymentIntent.metadata;
      const amountInTL = paymentIntent.amount / 100; // Convert kuruş to TL

      // Get student with lock
      const student = await Student.findOne({
        where: { userId: studentId },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!student) {
        throw new Error('Student not found');
      }

      const balanceBefore = parseFloat(student.walletBalance);
      const balanceAfter = balanceBefore + amountInTL;

      // Update wallet balance
      await student.update(
        { walletBalance: balanceAfter },
        { transaction: t }
      );

      // Create transaction record
      const transactionRecord = await Transaction.create(
        {
          studentId: studentId,
          type: 'deposit',
          amount: amountInTL,
          balanceBefore: balanceBefore,
          balanceAfter: balanceAfter,
          description: `Wallet top-up via Stripe - Payment ID: ${paymentIntent.id}`,
          referenceId: paymentIntent.id,
          referenceType: 'stripe_payment'
        },
        { transaction: t }
      );

      await t.commit();

      // Send email notification (async, non-blocking)
      this.sendTopUpEmail(studentId, amountInTL, balanceAfter).catch(err => {
        logger.error('Failed to send top-up email:', err);
      });

      logger.info(`Wallet topped up: Student ${studentId}, Amount: ${amountInTL} TL`);

      return {
        studentId,
        amount: amountInTL,
        newBalance: balanceAfter,
        transaction: transactionRecord
      };
    } catch (error) {
      await t.rollback();
      logger.error('Error in handlePaymentSuccess:', error);
      throw error;
    }
  }

  /**
   * Handle failed payment
   * @param {Object} paymentIntent - Stripe payment intent object
   * @returns {Promise<void>}
   */
  async handlePaymentFailed(paymentIntent) {
    const { studentId } = paymentIntent.metadata;
    
    logger.warn(`Payment failed: Student ${studentId}, Payment ID: ${paymentIntent.id}`);

    // Send failure notification email
    this.sendPaymentFailedEmail(studentId).catch(err => {
      logger.error('Failed to send payment failure email:', err);
    });
  }

  /**
   * Send top-up success email
   * @param {string} studentId - Student user ID
   * @param {number} amount - Amount topped up
   * @param {number} newBalance - New wallet balance
   * @returns {Promise<void>}
   */
  async sendTopUpEmail(studentId, amount, newBalance) {
    const Student = require('../models').Student;
    const User = require('../models').User;

    const student = await Student.findOne({
      where: { userId: studentId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['email', 'firstName', 'lastName']
        }
      ]
    });

    if (!student || !student.user) {
      throw new Error('Student not found for email');
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: `"Kampüs Yönetim Sistemi" <${process.env.SMTP_USER}>`,
      to: student.user.email,
      subject: '💰 Cüzdan Yükleme Başarılı',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Cüzdan Yükleme Başarılı!</h2>
          
          <p>Merhaba ${student.user.firstName} ${student.user.lastName},</p>
          
          <p>Cüzdanınıza başarıyla yükleme yapıldı.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <table style="width: 100%;">
              <tr>
                <td><strong>Yüklenen Tutar:</strong></td>
                <td style="text-align: right; color: #4CAF50; font-size: 18px;">${amount.toFixed(2)} TL</td>
              </tr>
              <tr>
                <td><strong>Yeni Bakiye:</strong></td>
                <td style="text-align: right; font-size: 18px;">${newBalance.toFixed(2)} TL</td>
              </tr>
            </table>
          </div>
          
          <p>Artık kampüs kafeteryalarından yemek rezervasyonu yapabilirsiniz!</p>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Top-up email sent to ${student.user.email}`);
  }

  /**
   * Send payment failed email
   * @param {string} studentId - Student user ID
   * @returns {Promise<void>}
   */
  async sendPaymentFailedEmail(studentId) {
    const Student = require('../models').Student;
    const User = require('../models').User;

    const student = await Student.findOne({
      where: { userId: studentId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['email', 'firstName', 'lastName']
        }
      ]
    });

    if (!student || !student.user) {
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: `"Kampüs Yönetim Sistemi" <${process.env.SMTP_USER}>`,
      to: student.user.email,
      subject: '❌ Ödeme Başarısız',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f44336;">Ödeme Başarısız</h2>
          
          <p>Merhaba ${student.user.firstName} ${student.user.lastName},</p>
          
          <p>Cüzdan yükleme işleminiz başarısız oldu.</p>
          
          <p>Lütfen kart bilgilerinizi kontrol edip tekrar deneyin.</p>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Sorun devam ederse lütfen destek ekibi ile iletişime geçin.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  }
}

module.exports = new WebhookService();

