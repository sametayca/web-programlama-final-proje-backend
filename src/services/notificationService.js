const emailService = require('./emailService');
const logger = require('../config/logger');

class NotificationService {
  /**
   * Send email notification
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} html - Email HTML content
   * @param {string} text - Email text content (optional)
   * @returns {Promise<void>}
   */
  async sendEmail(to, subject, html, text = null) {
    try {
      await emailService.sendEmail(to, subject, html, text);
      logger.info(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      // Don't throw - notifications are non-critical
    }
  }

  /**
   * Send meal reservation confirmation
   * @param {Object} reservation - Reservation data
   * @param {string} userEmail - User email
   * @param {string} userName - User name
   * @returns {Promise<void>}
   */
  async sendMealReservationConfirmation(reservation, userEmail, userName) {
    const subject = 'Yemek Rezervasyonu Onayı';
    const html = `
      <h2>Yemek Rezervasyonunuz Onaylandı</h2>
      <p>Sayın ${userName},</p>
      <p>Yemek rezervasyonunuz başarıyla oluşturuldu.</p>
      <p><strong>Rezervasyon Detayları:</strong></p>
      <ul>
        <li>QR Kod: ${reservation.qrCode}</li>
        <li>Tarih: ${reservation.reservationDate}</li>
        <li>Durum: ${reservation.status}</li>
      </ul>
      <p>QR kodunuzu kafeteryada göstererek yemeğinizi alabilirsiniz.</p>
    `;

    await this.sendEmail(userEmail, subject, html);
  }

  /**
   * Send meal reservation cancellation
   * @param {Object} reservation - Reservation data
   * @param {string} userEmail - User email
   * @param {string} userName - User name
   * @returns {Promise<void>}
   */
  async sendMealReservationCancellation(reservation, userEmail, userName) {
    const subject = 'Yemek Rezervasyonu İptali';
    const html = `
      <h2>Yemek Rezervasyonunuz İptal Edildi</h2>
      <p>Sayın ${userName},</p>
      <p>Yemek rezervasyonunuz iptal edilmiştir.</p>
      <p>İptal edilen rezervasyon: ${reservation.id}</p>
    `;

    await this.sendEmail(userEmail, subject, html);
  }

  /**
   * Send event registration confirmation
   * @param {Object} registration - Registration data
   * @param {Object} event - Event data
   * @param {string} userEmail - User email
   * @param {string} userName - User name
   * @returns {Promise<void>}
   */
  async sendEventRegistrationConfirmation(registration, event, userEmail, userName) {
    const subject = 'Etkinlik Kaydı Onayı';
    const html = `
      <h2>Etkinlik Kaydınız Onaylandı</h2>
      <p>Sayın ${userName},</p>
      <p><strong>${event.title}</strong> etkinliğine kaydınız başarıyla oluşturuldu.</p>
      <p><strong>Etkinlik Detayları:</strong></p>
      <ul>
        <li>Tarih: ${new Date(event.startDate).toLocaleDateString('tr-TR')}</li>
        <li>Konum: ${event.location}</li>
        <li>QR Kod: ${registration.qrCode}</li>
      </ul>
      <p>QR kodunuzu etkinlik girişinde göstererek katılım sağlayabilirsiniz.</p>
    `;

    await this.sendEmail(userEmail, subject, html);
  }

  /**
   * Send event registration cancellation
   * @param {Object} registration - Registration data
   * @param {Object} event - Event data
   * @param {string} userEmail - User email
   * @param {string} userName - User name
   * @returns {Promise<void>}
   */
  async sendEventRegistrationCancellation(registration, event, userEmail, userName) {
    const subject = 'Etkinlik Kaydı İptali';
    const html = `
      <h2>Etkinlik Kaydınız İptal Edildi</h2>
      <p>Sayın ${userName},</p>
      <p><strong>${event.title}</strong> etkinliğine kaydınız iptal edilmiştir.</p>
    `;

    await this.sendEmail(userEmail, subject, html);
  }

  /**
   * Send wallet top-up confirmation
   * @param {number} amount - Top-up amount
   * @param {number} newBalance - New wallet balance
   * @param {string} userEmail - User email
   * @param {string} userName - User name
   * @returns {Promise<void>}
   */
  async sendWalletTopUpConfirmation(amount, newBalance, userEmail, userName) {
    const subject = 'Cüzdan Yükleme Onayı';
    const html = `
      <h2>Cüzdanınıza Para Yüklendi</h2>
      <p>Sayın ${userName},</p>
      <p>Cüzdanınıza <strong>${amount} TL</strong> yüklenmiştir.</p>
      <p>Yeni bakiye: <strong>${newBalance} TL</strong></p>
    `;

    await this.sendEmail(userEmail, subject, html);
  }

  /**
   * Send push notification (placeholder - would integrate with FCM/APNS)
   * @param {string} userId - User ID
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @returns {Promise<void>}
   */
  async sendPushNotification(userId, title, body) {
    // Placeholder for push notification service
    logger.info(`Push notification to ${userId}: ${title} - ${body}`);
    // TODO: Integrate with FCM (Firebase Cloud Messaging) or APNS (Apple Push Notification Service)
  }

  /**
   * Send SMS notification (placeholder - would integrate with SMS gateway)
   * @param {string} phoneNumber - Phone number
   * @param {string} message - SMS message
   * @returns {Promise<void>}
   */
  async sendSMS(phoneNumber, message) {
    // Placeholder for SMS service
    logger.info(`SMS to ${phoneNumber}: ${message}`);
    // TODO: Integrate with SMS gateway (Twilio, AWS SNS, etc.)
  }
}

module.exports = new NotificationService();

