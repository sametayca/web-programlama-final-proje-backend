const { Notification, NotificationPreference, User, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Get notifications for authenticated user
 * GET /api/v1/notifications
 * Query params: page, limit, category, isRead
 */
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const { category, isRead } = req.query;

        const whereClause = { userId };

        if (category) {
            whereClause.category = category;
        }

        if (isRead !== undefined) {
            whereClause.isRead = isRead === 'true';
        }

        const { count, rows: notifications } = await Notification.findAndCountAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        // Get unread count
        const unreadCount = await Notification.count({
            where: { userId, isRead: false }
        });

        res.json({
            success: true,
            data: {
                notifications,
                unreadCount,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: limit
                }
            }
        });
    } catch (error) {
        console.error('Get Notifications Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * Get unread notification count
 * GET /api/v1/notifications/unread-count
 */
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;

        const unreadCount = await Notification.count({
            where: { userId, isRead: false }
        });

        res.json({
            success: true,
            data: { unreadCount }
        });
    } catch (error) {
        console.error('Get Unread Count Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * Mark notification as read
 * PUT /api/v1/notifications/:id/read
 */
exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const notification = await Notification.findOne({
            where: { id, userId }
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                error: 'Bildirim bulunamadı'
            });
        }

        notification.isRead = true;
        await notification.save();

        res.json({
            success: true,
            message: 'Bildirim okundu olarak işaretlendi',
            data: notification
        });
    } catch (error) {
        console.error('Mark As Read Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * Mark all notifications as read
 * PUT /api/v1/notifications/mark-all-read
 */
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        const [updateCount] = await Notification.update(
            { isRead: true },
            { where: { userId, isRead: false } }
        );

        res.json({
            success: true,
            message: `${updateCount} bildirim okundu olarak işaretlendi`
        });
    } catch (error) {
        console.error('Mark All As Read Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * Delete a notification
 * DELETE /api/v1/notifications/:id
 */
exports.deleteNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const notification = await Notification.findOne({
            where: { id, userId }
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                error: 'Bildirim bulunamadı'
            });
        }

        await notification.destroy();

        res.json({
            success: true,
            message: 'Bildirim silindi'
        });
    } catch (error) {
        console.error('Delete Notification Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * Delete all read notifications
 * DELETE /api/v1/notifications/clear-read
 */
exports.clearReadNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        const deleteCount = await Notification.destroy({
            where: { userId, isRead: true }
        });

        res.json({
            success: true,
            message: `${deleteCount} okunmuş bildirim silindi`
        });
    } catch (error) {
        console.error('Clear Read Notifications Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * Get notification preferences
 * GET /api/v1/notifications/preferences
 */
exports.getPreferences = async (req, res) => {
    try {
        const userId = req.user.id;

        let preferences = await NotificationPreference.findOne({
            where: { userId }
        });

        // Create default preferences if not exists
        if (!preferences) {
            preferences = await NotificationPreference.create({ userId });
        }

        res.json({
            success: true,
            data: preferences.toGroupedFormat()
        });
    } catch (error) {
        console.error('Get Preferences Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * Update notification preferences
 * PUT /api/v1/notifications/preferences
 */
exports.updatePreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const { email, push, sms } = req.body;

        let preferences = await NotificationPreference.findOne({
            where: { userId }
        });

        if (!preferences) {
            preferences = await NotificationPreference.create({ userId });
        }

        // Update email preferences
        if (email) {
            if (email.academic !== undefined) preferences.emailAcademic = email.academic;
            if (email.attendance !== undefined) preferences.emailAttendance = email.attendance;
            if (email.meal !== undefined) preferences.emailMeal = email.meal;
            if (email.event !== undefined) preferences.emailEvent = email.event;
            if (email.payment !== undefined) preferences.emailPayment = email.payment;
            if (email.system !== undefined) preferences.emailSystem = email.system;
        }

        // Update push preferences
        if (push) {
            if (push.academic !== undefined) preferences.pushAcademic = push.academic;
            if (push.attendance !== undefined) preferences.pushAttendance = push.attendance;
            if (push.meal !== undefined) preferences.pushMeal = push.meal;
            if (push.event !== undefined) preferences.pushEvent = push.event;
            if (push.payment !== undefined) preferences.pushPayment = push.payment;
            if (push.system !== undefined) preferences.pushSystem = push.system;
        }

        // Update SMS preferences
        if (sms) {
            if (sms.attendance !== undefined) preferences.smsAttendance = sms.attendance;
            if (sms.payment !== undefined) preferences.smsPayment = sms.payment;
        }

        await preferences.save();

        res.json({
            success: true,
            message: 'Bildirim tercihleri güncellendi',
            data: preferences.toGroupedFormat()
        });
    } catch (error) {
        console.error('Update Preferences Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * Create a notification (internal use or admin)
 * POST /api/v1/notifications
 */
exports.createNotification = async (req, res) => {
    try {
        const { userId, title, message, category, type, link, metadata } = req.body;

        // Validate required fields
        if (!userId || !title || !message) {
            return res.status(400).json({
                success: false,
                error: 'userId, title ve message alanları zorunludur'
            });
        }

        // Check if user exists
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Kullanıcı bulunamadı'
            });
        }

        const notification = await Notification.create({
            userId,
            title,
            message,
            category: category || 'system',
            type: type || 'info',
            link,
            metadata
        });

        // Broadcast via WebSocket if available
        const socketService = req.app.get('socketService');
        if (socketService) {
            socketService.sendNotificationToUser(userId, notification);
        }

        res.status(201).json({
            success: true,
            message: 'Bildirim oluşturuldu',
            data: notification
        });
    } catch (error) {
        console.error('Create Notification Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * Broadcast notification to all users (admin only)
 * POST /api/v1/notifications/broadcast
 */
exports.broadcastNotification = async (req, res) => {
    try {
        const { title, message, category, type, link, targetRole } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                error: 'title ve message alanları zorunludur'
            });
        }

        // Get target users
        const whereClause = {};
        if (targetRole) {
            whereClause.role = targetRole;
        }

        const users = await User.findAll({
            where: whereClause,
            attributes: ['id']
        });

        // Create notifications for all users
        const notifications = await Notification.bulkCreate(
            users.map(user => ({
                userId: user.id,
                title,
                message,
                category: category || 'system',
                type: type || 'info',
                link
            }))
        );

        // Broadcast via WebSocket if available
        const socketService = req.app.get('socketService');
        if (socketService) {
            socketService.broadcastNotification({ title, message, category, type, link }, targetRole);
        }

        res.status(201).json({
            success: true,
            message: `${notifications.length} kullanıcıya bildirim gönderildi`
        });
    } catch (error) {
        console.error('Broadcast Notification Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
