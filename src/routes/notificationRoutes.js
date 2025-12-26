const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authGuard = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

// Base Route: /api/v1/notifications

// All routes require authentication
router.use(authGuard);

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get notifications for authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [academic, attendance, meal, event, payment, system]
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of notifications with pagination
 */
router.get('/', notificationController.getNotifications);

/**
 * @swagger
 * /api/v1/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * @swagger
 * /api/v1/notifications/preferences:
 *   get:
 *     summary: Get notification preferences
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User notification preferences
 */
router.get('/preferences', notificationController.getPreferences);

/**
 * @swagger
 * /api/v1/notifications/preferences:
 *   put:
 *     summary: Update notification preferences
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: object
 *                 properties:
 *                   academic:
 *                     type: boolean
 *                   attendance:
 *                     type: boolean
 *                   meal:
 *                     type: boolean
 *                   event:
 *                     type: boolean
 *                   payment:
 *                     type: boolean
 *                   system:
 *                     type: boolean
 *               push:
 *                 type: object
 *               sms:
 *                 type: object
 *     responses:
 *       200:
 *         description: Preferences updated
 */
router.put('/preferences', notificationController.updatePreferences);

/**
 * @swagger
 * /api/v1/notifications/mark-all-read:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.put('/mark-all-read', notificationController.markAllAsRead);

/**
 * @swagger
 * /api/v1/notifications/clear-read:
 *   delete:
 *     summary: Delete all read notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Read notifications cleared
 */
router.delete('/clear-read', notificationController.clearReadNotifications);

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.put('/:id/read', notificationController.markAsRead);

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted
 */
router.delete('/:id', notificationController.deleteNotification);

// Admin only routes
/**
 * @swagger
 * /api/v1/notifications:
 *   post:
 *     summary: Create a notification (admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - title
 *               - message
 *             properties:
 *               userId:
 *                 type: string
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [academic, attendance, meal, event, payment, system]
 *               type:
 *                 type: string
 *                 enum: [info, warning, success, error]
 *               link:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notification created
 */
router.post('/', roleGuard('admin'), notificationController.createNotification);

/**
 * @swagger
 * /api/v1/notifications/broadcast:
 *   post:
 *     summary: Broadcast notification to all users (admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               category:
 *                 type: string
 *               type:
 *                 type: string
 *               targetRole:
 *                 type: string
 *                 enum: [student, faculty, admin, staff]
 *     responses:
 *       201:
 *         description: Notifications sent
 */
router.post('/broadcast', roleGuard('admin'), notificationController.broadcastNotification);

module.exports = router;
