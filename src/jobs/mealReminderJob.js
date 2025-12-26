const cron = require('node-cron');
const { MealReservation, User, Notification } = require('../models');
const { Op } = require('sequelize');
const emailService = require('../services/emailService');
const logger = require('../config/logger');

/**
 * Meal Reminder Job
 * Sends reminders for meal reservations
 */
class MealReminderJob {
    constructor() {
        this.isRunning = false;
    }

    /**
     * Send reminder email
     */
    async sendReminderEmail(user, reservation) {
        try {
            const mealTypeLabels = {
                breakfast: 'Kahvaltı',
                lunch: 'Öğle Yemeği',
                dinner: 'Akşam Yemeği'
            };

            const subject = `🍽️ ${mealTypeLabels[reservation.mealType]} Hatırlatması`;

            const html = `
        <h2>Yemek Rezervasyonu Hatırlatması</h2>
        <p>Sayın ${user.firstName} ${user.lastName},</p>
        <p>Bugün için <strong>${mealTypeLabels[reservation.mealType]}</strong> rezervasyonunuz bulunmaktadır.</p>
        <p><strong>Rezervasyon Detayları:</strong></p>
        <ul>
          <li>QR Kod: ${reservation.qrCode}</li>
          <li>Tarih: ${new Date(reservation.date).toLocaleDateString('tr-TR')}</li>
        </ul>
        <p>QR kodunuzu kafeteryada göstermeyi unutmayın!</p>
        <p>Akıllı Kampüs Yönetim Platformu</p>
      `;

            await emailService.sendEmail(user.email, subject, html);
            logger.info(`Meal reminder sent to ${user.email}`);
        } catch (error) {
            logger.error(`Failed to send meal reminder to ${user.email}:`, error.message);
        }
    }

    /**
     * Create in-app notification
     */
    async createNotification(userId, reservation) {
        try {
            const mealTypeLabels = {
                breakfast: 'Kahvaltı',
                lunch: 'Öğle Yemeği',
                dinner: 'Akşam Yemeği'
            };

            await Notification.create({
                userId,
                title: `🍽️ ${mealTypeLabels[reservation.mealType]} Hatırlatması`,
                message: `Bugün için yemek rezervasyonunuz var. QR kodunuzu hazırlayın!`,
                category: 'meal',
                type: 'info',
                link: '/meals/reservations'
            });
        } catch (error) {
            logger.error(`Failed to create meal notification:`, error.message);
        }
    }

    /**
     * Process meal reminders for today
     */
    async processDailyReminders() {
        if (this.isRunning) {
            logger.info('Meal reminder job already running, skipping...');
            return;
        }

        this.isRunning = true;
        logger.info('Running meal reminders...');

        try {
            const today = new Date().toISOString().split('T')[0];

            const reservations = await MealReservation.findAll({
                where: {
                    date: today,
                    status: 'active'
                },
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                }]
            });

            logger.info(`Found ${reservations.length} active meal reservations for today`);

            for (const reservation of reservations) {
                if (reservation.user) {
                    await this.sendReminderEmail(reservation.user, reservation);
                    await this.createNotification(reservation.user.id, reservation);
                }
            }

            logger.info('Meal reminders completed');
        } catch (error) {
            logger.error('Meal reminder error:', error);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Start the cron job
     */
    start() {
        // Run every day at 7:00 AM (before breakfast)
        cron.schedule('0 7 * * *', async () => {
            await this.processDailyReminders();
        }, {
            scheduled: true,
            timezone: "Europe/Istanbul"
        });

        logger.info('✅ Meal reminder job scheduled (daily at 7:00 AM)');
        console.log('✅ Meal reminder job scheduled (daily at 7:00 AM)');
    }

    stop() {
        logger.info('Meal reminder job stopped');
    }
}

module.exports = new MealReminderJob();
