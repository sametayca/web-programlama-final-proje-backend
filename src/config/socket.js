const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('./logger');

class SocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map(); // userId -> Set of socket ids
    }

    /**
     * Initialize Socket.io server
     * @param {http.Server} httpServer - HTTP server to attach to
     */
    initialize(httpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: [
                    'http://localhost:3001',
                    'http://127.0.0.1:3001',
                    'http://localhost:5173',
                    'http://127.0.0.1:5173',
                    process.env.FRONTEND_URL || 'http://localhost:3001'
                ],
                methods: ['GET', 'POST'],
                credentials: true
            },
            pingTimeout: 60000,
            pingInterval: 25000
        });

        // Authentication middleware
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

                if (!token) {
                    return next(new Error('Authentication required'));
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                socket.user = decoded;
                next();
            } catch (error) {
                logger.error('Socket authentication error:', error.message);
                next(new Error('Invalid token'));
            }
        });

        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });

        logger.info('✅ Socket.io server initialized');
        return this.io;
    }

    /**
     * Handle new socket connection
     */
    handleConnection(socket) {
        const userId = socket.user.id;
        const userRole = socket.user.role;

        // Add to connected users map
        if (!this.connectedUsers.has(userId)) {
            this.connectedUsers.set(userId, new Set());
        }
        this.connectedUsers.get(userId).add(socket.id);

        // Join user-specific room
        socket.join(`user:${userId}`);

        // Join role-specific room
        socket.join(`role:${userRole}`);

        logger.info(`User ${userId} connected (socket: ${socket.id})`);

        // Handle joining sensor rooms for real-time data
        socket.on('subscribe:sensor', (sensorId) => {
            socket.join(`sensor:${sensorId}`);
            logger.info(`User ${userId} subscribed to sensor ${sensorId}`);
        });

        socket.on('unsubscribe:sensor', (sensorId) => {
            socket.leave(`sensor:${sensorId}`);
            logger.info(`User ${userId} unsubscribed from sensor ${sensorId}`);
        });

        // Handle admin subscribing to all sensors
        socket.on('subscribe:all-sensors', () => {
            if (userRole === 'admin' || userRole === 'staff') {
                socket.join('all-sensors');
                logger.info(`Admin ${userId} subscribed to all sensors`);
            }
        });

        // Handle attendance session subscription (for faculty)
        socket.on('subscribe:attendance', (sessionId) => {
            if (userRole === 'faculty' || userRole === 'admin') {
                socket.join(`attendance:${sessionId}`);
                logger.info(`Faculty ${userId} subscribed to attendance session ${sessionId}`);
            }
        });

        socket.on('unsubscribe:attendance', (sessionId) => {
            socket.leave(`attendance:${sessionId}`);
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            const userSockets = this.connectedUsers.get(userId);
            if (userSockets) {
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    this.connectedUsers.delete(userId);
                }
            }
            logger.info(`User ${userId} disconnected (socket: ${socket.id})`);
        });

        // Send initial connection success
        socket.emit('connected', {
            message: 'Connected to real-time server',
            userId,
            role: userRole
        });
    }

    /**
     * Send notification to specific user
     */
    sendNotificationToUser(userId, notification) {
        if (this.io) {
            this.io.to(`user:${userId}`).emit('notification', notification);
            logger.info(`Notification sent to user ${userId}`);
        }
    }

    /**
     * Broadcast notification to all users or specific role
     */
    broadcastNotification(notification, targetRole = null) {
        if (this.io) {
            if (targetRole) {
                this.io.to(`role:${targetRole}`).emit('notification', notification);
                logger.info(`Notification broadcasted to role ${targetRole}`);
            } else {
                this.io.emit('notification', notification);
                logger.info('Notification broadcasted to all users');
            }
        }
    }

    /**
     * Broadcast sensor reading to subscribers
     */
    broadcastSensorReading(sensorId, reading) {
        if (this.io) {
            this.io.to(`sensor:${sensorId}`).emit('sensor:reading', {
                sensorId,
                ...reading
            });
            this.io.to('all-sensors').emit('sensor:reading', {
                sensorId,
                ...reading
            });
        }
    }

    /**
     * Broadcast sensor alert
     */
    broadcastSensorAlert(sensor, value) {
        if (this.io) {
            this.io.to('role:admin').to('role:staff').emit('sensor:alert', {
                sensorId: sensor.id,
                sensorName: sensor.name,
                location: sensor.location,
                value,
                unit: sensor.unit,
                minThreshold: sensor.minThreshold,
                maxThreshold: sensor.maxThreshold,
                message: `Sensör ${sensor.name} eşik değerini aştı: ${value} ${sensor.unit}`
            });
            logger.warn(`Sensor alert: ${sensor.name} - ${value} ${sensor.unit}`);
        }
    }

    /**
     * Broadcast attendance update to faculty dashboard
     */
    broadcastAttendanceUpdate(sessionId, update) {
        if (this.io) {
            this.io.to(`attendance:${sessionId}`).emit('attendance:update', {
                sessionId,
                ...update
            });
        }
    }

    /**
     * Get number of connected users
     */
    getConnectedUsersCount() {
        return this.connectedUsers.size;
    }

    /**
     * Check if user is connected
     */
    isUserConnected(userId) {
        return this.connectedUsers.has(userId);
    }

    /**
     * Get Socket.io instance
     */
    getIO() {
        return this.io;
    }
}

module.exports = new SocketService();
