const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');
const authGuard = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

// Base Route: /api/v1/sensors

// All routes require authentication
router.use(authGuard);

/**
 * @swagger
 * /api/v1/sensors/stats/summary:
 *   get:
 *     summary: Get sensor statistics summary
 *     tags: [IoT Sensors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sensor statistics
 */
router.get('/stats/summary', roleGuard('admin'), sensorController.getSensorStats);

/**
 * @swagger
 * /api/v1/sensors:
 *   get:
 *     summary: Get all sensors
 *     tags: [IoT Sensors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [temperature, occupancy, energy, humidity]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, maintenance]
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of sensors
 */
router.get('/', sensorController.getSensors);

/**
 * @swagger
 * /api/v1/sensors:
 *   post:
 *     summary: Create a new sensor (admin only)
 *     tags: [IoT Sensors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - location
 *               - unit
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [temperature, occupancy, energy, humidity]
 *               location:
 *                 type: string
 *               unit:
 *                 type: string
 *               minThreshold:
 *                 type: number
 *               maxThreshold:
 *                 type: number
 *     responses:
 *       201:
 *         description: Sensor created
 */
router.post('/', roleGuard('admin'), sensorController.createSensor);

/**
 * @swagger
 * /api/v1/sensors/{id}:
 *   get:
 *     summary: Get a single sensor
 *     tags: [IoT Sensors]
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
 *         description: Sensor details
 */
router.get('/:id', sensorController.getSensor);

/**
 * @swagger
 * /api/v1/sensors/{id}:
 *   put:
 *     summary: Update a sensor (admin only)
 *     tags: [IoT Sensors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               status:
 *                 type: string
 *               minThreshold:
 *                 type: number
 *               maxThreshold:
 *                 type: number
 *     responses:
 *       200:
 *         description: Sensor updated
 */
router.put('/:id', roleGuard('admin'), sensorController.updateSensor);

/**
 * @swagger
 * /api/v1/sensors/{id}:
 *   delete:
 *     summary: Delete a sensor (admin only)
 *     tags: [IoT Sensors]
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
 *         description: Sensor deleted
 */
router.delete('/:id', roleGuard('admin'), sensorController.deleteSensor);

/**
 * @swagger
 * /api/v1/sensors/{id}/data:
 *   get:
 *     summary: Get sensor data with optional aggregation
 *     tags: [IoT Sensors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: aggregation
 *         schema:
 *           type: string
 *           enum: [raw, hourly, daily]
 *           default: raw
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Sensor data
 */
router.get('/:id/data', sensorController.getSensorData);

/**
 * @swagger
 * /api/v1/sensors/{id}/latest:
 *   get:
 *     summary: Get latest sensor reading
 *     tags: [IoT Sensors]
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
 *         description: Latest reading
 */
router.get('/:id/latest', sensorController.getLatestReading);

/**
 * @swagger
 * /api/v1/sensors/{id}/readings:
 *   post:
 *     summary: Add sensor reading (for IoT devices)
 *     tags: [IoT Sensors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 type: number
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Reading added
 */
router.post('/:id/readings', sensorController.addReading);

module.exports = router;
