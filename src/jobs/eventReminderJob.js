const cron = require('node-cron');
const { Event, EventRegistration, User, Notification } = require('../models');
const { Op } = require('sequelize');
const emailService = require('../services/emailService');
const logger = require('../config/logger');

/**
 * Event Reminder Job
 * Sends reminders 1 day and 1 hour before events
 */
class EventReminderJob {
    constructor() {
        this.isRunning = false;
    }

    /**
     * Send reminder email
     */
    async sendReminderEmail(user, event, type = '1day') {
        try {
            const subject = type === '1day'
                ? `📅 Yarın: ${event.title}`
                : `⏰ 1 Saat Sonra: ${event.title}`;

            const timeText = type === '1day' ? 'yarın' : '1 saat sonra';

            const html = `
        <h2>Etkinlik Hatırlatması</h2>
        <p>Sayın ${user.firstName} ${user.lastName},</p>
        <p>Kayıt olduğunuz <strong>${event.title}</strong> etkinliği ${timeText} gerçekleşecek.</p>
        <p><strong>Etkinlik Detayları:</strong></p>
        <ul>
          <li>Tarih: ${new Date(event.date).toLocaleDateString('tr-TR')}</li>
          <li>Saat: ${new Date(event.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</li>
          <li>Konum: ${event.location}</li>
        </ul>
        <p>Katılımınızı bekliyoruz!</p>
        <p>Akıllı Kampüs Yönetim Platformu</p>
      `;

            await emailService.sendEmail(user.email, subject, html);
            logger.info(`Event reminder sent to ${user.email} for ${event.title}`);
        } catch (error) {
            logger.error(`Failed to send event reminder to ${user.email}:`, error.message);
        }
    }

    /**
     * Create in-app notification
     */
    async createNotification(userId, event, type = '1day') {
        try {
            const title = type === '1day'
                ? `📅 Yarın: ${event.title}`
                : `⏰ 1 Saat Sonra: ${event.title}`;

            const message = type === '1day'
                ? `Kayıt olduğunuz etkinlik yarın gerçekleşecek. Konum: ${event.location}`
                : `Kayıt olduğunuz etkinlik 1 saat sonra başlayacak. Konum: ${event.location}`;

            await Notification.create({
                userId,
                title,
                message,
                category: 'event',
                type: 'info',
                link: `/events/${event.id}`
            });
        } catch (error) {
            logger.error(`Failed to create event notification:`, error.message);
        }
    }

    /**
     * Process 1-day reminders
     */
    async process1DayReminders() {
        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const endOfTomorrow = new Date(tomorrow);
            endOfTomorrow.setHours(23, 59, 59, 999);

            const events = await Event.findAll({
                where: {
                    date: {
                        [Op.gte]: tomorrow,
                        [Op.lte]: endOfTomorrow
                    },
                    status: 'upcoming'
                }
            });

            logger.info(`Found ${events.length} events for 1-day reminders`);

            for (const event of events) {
                const registrations = await EventRegistration.findAll({
                    where: {
                        eventId: event.id,
                        status: { [Op.in]: ['registered', 'confirmed'] }
                    },
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['id', 'firstName', 'lastName', 'email']
                    }]
                });

                for (const reg of registrations) {
                    if (reg.user) {
                        await this.sendReminderEmail(reg.user, event, '1day');
                        await this.createNotification(reg.user.id, event, '1day');
                    }
                }
            }
        } catch (error) {
            logger.error('1-day reminder error:', error);
        }
    }

    /**
     * Process 1-hour reminders
     */
    async process1HourReminders() {
        try {
            const oneHourLater = new Date();
            oneHourLater.setHours(oneHourLater.getHours() + 1);

            const startWindow = new Date(oneHourLater);
            startWindow.setMinutes(startWindow.getMinutes() - 5);

            const endWindow = new Date(oneHourLater);
            endWindow.setMinutes(endWindow.getMinutes() + 5);

            const events = await Event.findAll({
                where: {
                    date: {
                        [Op.gte]: startWindow,
                        [Op.lte]: endWindow
                    },
                    status: 'upcoming'
                }
            });

            logger.info(`Found ${events.length} events for 1-hour reminders`);

            for (const event of events) {
                const registrations = await EventRegistration.findAll({
                    where: {
                        eventId: event.id,
                        status: { [Op.in]: ['registered', 'confirmed'] }
                    },
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['id', 'firstName', 'lastName', 'email']
                    }]
                });

                for (const reg of registrations) {
                    if (reg.user) {
                        await this.sendReminderEmail(reg.user, event, '1hour');
                        await this.createNotification(reg.user.id, event, '1hour');
                    }
                }
            }
        } catch (error) {
            logger.error('1-hour reminder error:', error);
        }
    }

    /**
     * Start the cron jobs
     */
    start() {
        // Run 1-day reminders every day at 10:00 AM
        cron.schedule('0 10 * * *', async () => {
            logger.info('Running 1-day event reminders...');
            await this.process1DayReminders();
        }, {
            scheduled: true,
            timezone: "Europe/Istanbul"
        });

        // Run 1-hour reminders every 10 minutes
        cron.schedule('*/10 * * * *', async () => {
            await this.process1HourReminders();
        }, {
            scheduled: true,
            timezone: "Europe/Istanbul"
        });

        logger.info('✅ Event reminder jobs scheduled');
        console.log('✅ Event reminder jobs scheduled');
    }

    stop() {
        logger.info('Event reminder jobs stopped');
    }
}

module.exports = new EventReminderJob();
