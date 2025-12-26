const emailService = require('./emailService');
const logger = require('../config/logger');

class NotificationService {
  /**
   * Get database models (lazy loaded to avoid circular dependencies)
   */
  getModels() {
    if (!this._models) {
      this._models = require('../models');
    }
    return this._models;
  }

  /**
   * Get socket service (lazy loaded)
   */
  getSocketService() {
    try {
      return require('../config/socket');
    } catch {
      return null;
    }
  }

  /**
   * Create in-app notification and optionally send via other channels
   * @param {Object} options - Notification options
   * @returns {Promise<Object>} Created notification
   */
  async createNotification({ userId, title, message, category = 'system', type = 'info', link = null, metadata = null }) {
    try {
      const { Notification, NotificationPreference } = this.getModels();

      // Create in-app notification
      const notification = await Notification.create({
        userId,
        title,
        message,
        category,
        type,
        link,
        metadata
      });

      // Broadcast via WebSocket
      const socketService = this.getSocketService();
      if (socketService && socketService.sendNotificationToUser) {
        socketService.sendNotificationToUser(userId, notification);
      }

      // Check user preferences and send other channels
      let preferences = await NotificationPreference.findOne({ where: { userId } });
      if (!preferences) {
        // Create default preferences
        preferences = await NotificationPreference.create({ userId });
      }

      // Send email if enabled
      const emailPref = preferences[`email${category.charAt(0).toUpperCase() + category.slice(1)}`];
      if (emailPref) {
        const { User } = this.getModels();
        const user = await User.findByPk(userId);
        if (user?.email) {
          await this.sendEmail(user.email, title, `<p>${message}</p>`);
        }
      }

      logger.info(`In-app notification created for user ${userId}: ${title}`);
      return notification;
    } catch (error) {
      logger.error('Failed to create notification:', error);
      // Don't throw - notifications are non-critical
      return null;
    }
  }

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
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async sendMealReservationConfirmation(reservation, userEmail, userName, userId) {
    const subject = 'Yemek Rezervasyonu Onayı';
    const html = `
      <h2>Yemek Rezervasyonunuz Onaylandı</h2>
      <p>Sayın ${userName},</p>
      <p>Yemek rezervasyonunuz başarıyla oluşturuldu.</p>
      <p><strong>Rezervasyon Detayları:</strong></p>
      <ul>
        <li>QR Kod: ${reservation.qrCode}</li>
        <li>Tarih: ${reservation.reservationDate || reservation.date}</li>
        <li>Durum: ${reservation.status}</li>
      </ul>
      <p>QR kodunuzu kafeteryada göstererek yemeğinizi alabilirsiniz.</p>
    `;

    await this.sendEmail(userEmail, subject, html);

    // Create in-app notification
    if (userId) {
      await this.createNotification({
        userId,
        title: '🍽️ Yemek Rezervasyonu Onaylandı',
        message: `Yemek rezervasyonunuz (QR: ${reservation.qrCode}) başarıyla oluşturuldu.`,
        category: 'meal',
        type: 'success',
        link: '/meals/reservations'
      });
    }
  }

  /**
   * Send meal reservation cancellation
   * @param {Object} reservation - Reservation data
   * @param {string} userEmail - User email
   * @param {string} userName - User name
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async sendMealReservationCancellation(reservation, userEmail, userName, userId) {
    const subject = 'Yemek Rezervasyonu İptali';
    const html = `
      <h2>Yemek Rezervasyonunuz İptal Edildi</h2>
      <p>Sayın ${userName},</p>
      <p>Yemek rezervasyonunuz iptal edilmiştir.</p>
      <p>İptal edilen rezervasyon: ${reservation.id}</p>
    `;

    await this.sendEmail(userEmail, subject, html);

    // Create in-app notification
    if (userId) {
      await this.createNotification({
        userId,
        title: '🍽️ Yemek Rezervasyonu İptal Edildi',
        message: 'Yemek rezervasyonunuz iptal edilmiştir.',
        category: 'meal',
        type: 'warning',
        link: '/meals/reservations'
      });
    }
  }

  /**
   * Send event registration confirmation
   * @param {Object} registration - Registration data
   * @param {Object} event - Event data
   * @param {string} userEmail - User email
   * @param {string} userName - User name
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async sendEventRegistrationConfirmation(registration, event, userEmail, userName, userId) {
    const subject = 'Etkinlik Kaydı Onayı';
    const html = `
      <h2>Etkinlik Kaydınız Onaylandı</h2>
      <p>Sayın ${userName},</p>
      <p><strong>${event.title}</strong> etkinliğine kaydınız başarıyla oluşturuldu.</p>
      <p><strong>Etkinlik Detayları:</strong></p>
      <ul>
        <li>Tarih: ${new Date(event.startDate || event.date).toLocaleDateString('tr-TR')}</li>
        <li>Konum: ${event.location}</li>
        <li>QR Kod: ${registration.qrCode}</li>
      </ul>
      <p>QR kodunuzu etkinlik girişinde göstererek katılım sağlayabilirsiniz.</p>
    `;

    await this.sendEmail(userEmail, subject, html);

    // Create in-app notification
    if (userId) {
      await this.createNotification({
        userId,
        title: `📅 ${event.title} - Kayıt Onaylandı`,
        message: `${event.title} etkinliğine kaydınız alındı.`,
        category: 'event',
        type: 'success',
        link: `/events/${event.id}`
      });
    }
  }

  /**
   * Send event registration cancellation
   * @param {Object} registration - Registration data
   * @param {Object} event - Event data
   * @param {string} userEmail - User email
   * @param {string} userName - User name
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async sendEventRegistrationCancellation(registration, event, userEmail, userName, userId) {
    const subject = 'Etkinlik Kaydı İptali';
    const html = `
      <h2>Etkinlik Kaydınız İptal Edildi</h2>
      <p>Sayın ${userName},</p>
      <p><strong>${event.title}</strong> etkinliğine kaydınız iptal edilmiştir.</p>
    `;

    await this.sendEmail(userEmail, subject, html);

    // Create in-app notification
    if (userId) {
      await this.createNotification({
        userId,
        title: `📅 ${event.title} - Kayıt İptal Edildi`,
        message: `${event.title} etkinliğine kaydınız iptal edildi.`,
        category: 'event',
        type: 'warning',
        link: '/events'
      });
    }
  }

  /**
   * Send wallet top-up confirmation
   * @param {number} amount - Top-up amount
   * @param {number} newBalance - New wallet balance
   * @param {string} userEmail - User email
   * @param {string} userName - User name
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async sendWalletTopUpConfirmation(amount, newBalance, userEmail, userName, userId) {
    const subject = 'Cüzdan Yükleme Onayı';
    const html = `
      <h2>Cüzdanınıza Para Yüklendi</h2>
      <p>Sayın ${userName},</p>
      <p>Cüzdanınıza <strong>${amount} TL</strong> yüklenmiştir.</p>
      <p>Yeni bakiye: <strong>${newBalance} TL</strong></p>
    `;

    await this.sendEmail(userEmail, subject, html);

    // Create in-app notification
    if (userId) {
      await this.createNotification({
        userId,
        title: '💰 Cüzdanınıza Para Yüklendi',
        message: `Cüzdanınıza ${amount} TL yüklendi. Yeni bakiye: ${newBalance} TL`,
        category: 'payment',
        type: 'success',
        link: '/wallet'
      });
    }
  }

  /**
   * Send attendance warning
   * @param {string} userId - User ID
   * @param {string} userEmail - User email
   * @param {string} userName - User name
   * @param {Object} courseInfo - Course information
   * @param {number} attendanceRate - Current attendance rate
   * @returns {Promise<void>}
   */
  async sendAttendanceWarning(userId, userEmail, userName, courseInfo, attendanceRate) {
    const subject = `⚠️ Devamsızlık Uyarısı - ${courseInfo.name}`;
    const html = `
      <h2>Devamsızlık Uyarısı</h2>
      <p>Sayın ${userName},</p>
      <p><strong>${courseInfo.code} - ${courseInfo.name}</strong> dersindeki devamsızlık oranınız kritik seviyeye ulaştı.</p>
      <p>Mevcut devam oranı: <strong>%${attendanceRate}</strong></p>
      <p>Devamsızlık sınırını aşmanız durumunda dersten kalma durumu ile karşılaşabilirsiniz.</p>
    `;

    await this.sendEmail(userEmail, subject, html);

    // Create in-app notification
    if (userId) {
      await this.createNotification({
        userId,
        title: `⚠️ Devamsızlık Uyarısı - ${courseInfo.code}`,
        message: `${courseInfo.name} dersindeki devam oranınız %${attendanceRate}. Dikkat!`,
        category: 'attendance',
        type: 'warning',
        link: '/my-attendance'
      });
    }
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

  /**
   * Broadcast notification to all users or specific role
   * @param {Object} options - Notification options
   * @param {string} targetRole - Optional target role
   * @returns {Promise<number>} Number of notifications sent
   */
  async broadcastNotification({ title, message, category = 'system', type = 'info', link = null }, targetRole = null) {
    try {
      const { User, Notification } = this.getModels();

      const whereClause = {};
      if (targetRole) {
        whereClause.role = targetRole;
      }

      const users = await User.findAll({
        where: whereClause,
        attributes: ['id']
      });

      const notifications = await Notification.bulkCreate(
        users.map(user => ({
          userId: user.id,
          title,
          message,
          category,
          type,
          link
        }))
      );

      // Broadcast via WebSocket
      const socketService = this.getSocketService();
      if (socketService && socketService.broadcastNotification) {
        socketService.broadcastNotification({ title, message, category, type, link }, targetRole);
      }

      logger.info(`Broadcast notification sent to ${notifications.length} users`);
      return notifications.length;
    } catch (error) {
      logger.error('Failed to broadcast notification:', error);
      return 0;
    }
  }
}

module.exports = new NotificationService();
