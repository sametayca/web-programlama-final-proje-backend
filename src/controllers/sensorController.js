const { Sensor, SensorData, sequelize } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

/**
 * Get all sensors
 * GET /api/v1/sensors
 */
exports.getSensors = async (req, res) => {
    try {
        const { type, status, location } = req.query;

        const whereClause = {};
        if (type) whereClause.type = type;
        if (status) whereClause.status = status;
        if (location) whereClause.location = { [Op.iLike]: `%${location}%` };

        const sensors = await Sensor.findAll({
            where: whereClause,
            order: [['name', 'ASC']]
        });

        res.json({
            success: true,
            data: sensors.map(sensor => ({
                ...sensor.toJSON(),
                statusLabel: sensor.getStatusLabel(),
                isWithinThreshold: sensor.lastReading !== null
                    ? sensor.isWithinThreshold(sensor.lastReading)
                    : null
            }))
        });
    } catch (error) {
        console.error('Get Sensors Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * Get a single sensor
 * GET /api/v1/sensors/:id
 */
exports.getSensor = async (req, res) => {
    try {
        const { id } = req.params;

        const sensor = await Sensor.findByPk(id);

        if (!sensor) {
            return res.status(404).json({
                success: false,
                error: 'Sensör bulunamadı'
            });
        }

        res.json({
            success: true,
            data: {
                ...sensor.toJSON(),
                statusLabel: sensor.getStatusLabel(),
                isWithinThreshold: sensor.lastReading !== null
                    ? sensor.isWithinThreshold(sensor.lastReading)
                    : null
            }
        });
    } catch (error) {
        console.error('Get Sensor Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * Get sensor data with time range and aggregation
 * GET /api/v1/sensors/:id/data
 * Query params: startDate, endDate, aggregation (raw, hourly, daily)
 */
exports.getSensorData = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            startDate,
            endDate,
            aggregation = 'raw',
            limit = 100
        } = req.query;

        const sensor = await Sensor.findByPk(id);
        if (!sensor) {
            return res.status(404).json({
                success: false,
                error: 'Sensör bulunamadı'
            });
        }

        const whereClause = { sensorId: id };

        // Default to last 24 hours if no date range specified
        if (startDate) {
            whereClause.timestamp = { ...whereClause.timestamp, [Op.gte]: new Date(startDate) };
        } else {
            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);
            whereClause.timestamp = { [Op.gte]: oneDayAgo };
        }

        if (endDate) {
            whereClause.timestamp = { ...whereClause.timestamp, [Op.lte]: new Date(endDate) };
        }

        let data;

        if (aggregation === 'raw') {
            data = await SensorData.findAll({
                where: whereClause,
                order: [['timestamp', 'DESC']],
                limit: parseInt(limit)
            });
        } else if (aggregation === 'hourly') {
            // Aggregate by hour
            data = await SensorData.findAll({
                attributes: [
                    [fn('DATE_TRUNC', 'hour', col('timestamp')), 'hour'],
                    [fn('AVG', col('value')), 'avgValue'],
                    [fn('MIN', col('value')), 'minValue'],
                    [fn('MAX', col('value')), 'maxValue'],
                    [fn('COUNT', col('id')), 'count']
                ],
                where: whereClause,
                group: [fn('DATE_TRUNC', 'hour', col('timestamp'))],
                order: [[fn('DATE_TRUNC', 'hour', col('timestamp')), 'DESC']],
                raw: true
            });
        } else if (aggregation === 'daily') {
            // Aggregate by day
            data = await SensorData.findAll({
                attributes: [
                    [fn('DATE_TRUNC', 'day', col('timestamp')), 'day'],
                    [fn('AVG', col('value')), 'avgValue'],
                    [fn('MIN', col('value')), 'minValue'],
                    [fn('MAX', col('value')), 'maxValue'],
                    [fn('COUNT', col('id')), 'count']
                ],
                where: whereClause,
                group: [fn('DATE_TRUNC', 'day', col('timestamp'))],
                order: [[fn('DATE_TRUNC', 'day', col('timestamp')), 'DESC']],
                raw: true
            });
        }

        res.json({
            success: true,
            data: {
                sensor: {
                    id: sensor.id,
                    name: sensor.name,
                    type: sensor.type,
                    unit: sensor.unit
                },
                readings: data,
                aggregation,
                count: data.length
            }
        });
    } catch (error) {
        console.error('Get Sensor Data Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * Get latest reading for a sensor
 * GET /api/v1/sensors/:id/latest
 */
exports.getLatestReading = async (req, res) => {
    try {
        const { id } = req.params;

        const sensor = await Sensor.findByPk(id);
        if (!sensor) {
            return res.status(404).json({
                success: false,
                error: 'Sensör bulunamadı'
            });
        }

        const latestReading = await SensorData.findOne({
            where: { sensorId: id },
            order: [['timestamp', 'DESC']]
        });

        res.json({
            success: true,
            data: {
                sensor: {
                    id: sensor.id,
                    name: sensor.name,
                    type: sensor.type,
                    unit: sensor.unit,
                    location: sensor.location
                },
                reading: latestReading,
                isWithinThreshold: latestReading
                    ? sensor.isWithinThreshold(latestReading.value)
                    : null
            }
        });
    } catch (error) {
        console.error('Get Latest Reading Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * Create a new sensor (admin only)
 * POST /api/v1/sensors
 */
exports.createSensor = async (req, res) => {
    try {
        const { name, type, location, unit, minThreshold, maxThreshold, metadata } = req.body;

        if (!name || !type || !location || !unit) {
            return res.status(400).json({
                success: false,
                error: 'name, type, location ve unit alanları zorunludur'
            });
        }

        const sensor = await Sensor.create({
            name,
            type,
            location,
            unit,
            minThreshold,
            maxThreshold,
            metadata,
            status: 'active'
        });

        res.status(201).json({
            success: true,
            message: 'Sensör oluşturuldu',
            data: sensor
        });
    } catch (error) {
        console.error('Create Sensor Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * Update a sensor (admin only)
 * PUT /api/v1/sensors/:id
 */
exports.updateSensor = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, location, status, minThreshold, maxThreshold, metadata } = req.body;

        const sensor = await Sensor.findByPk(id);
        if (!sensor) {
            return res.status(404).json({
                success: false,
                error: 'Sensör bulunamadı'
            });
        }

        if (name) sensor.name = name;
        if (location) sensor.location = location;
        if (status) sensor.status = status;
        if (minThreshold !== undefined) sensor.minThreshold = minThreshold;
        if (maxThreshold !== undefined) sensor.maxThreshold = maxThreshold;
        if (metadata) sensor.metadata = { ...sensor.metadata, ...metadata };

        await sensor.save();

        res.json({
            success: true,
            message: 'Sensör güncellendi',
            data: sensor
        });
    } catch (error) {
        console.error('Update Sensor Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * Delete a sensor (admin only)
 * DELETE /api/v1/sensors/:id
 */
exports.deleteSensor = async (req, res) => {
    try {
        const { id } = req.params;

        const sensor = await Sensor.findByPk(id);
        if (!sensor) {
            return res.status(404).json({
                success: false,
                error: 'Sensör bulunamadı'
            });
        }

        await sensor.destroy();

        res.json({
            success: true,
            message: 'Sensör silindi'
        });
    } catch (error) {
        console.error('Delete Sensor Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * Add sensor reading (for IoT devices or simulator)
 * POST /api/v1/sensors/:id/readings
 */
exports.addReading = async (req, res) => {
    try {
        const { id } = req.params;
        const { value, timestamp } = req.body;

        const sensor = await Sensor.findByPk(id);
        if (!sensor) {
            return res.status(404).json({
                success: false,
                error: 'Sensör bulunamadı'
            });
        }

        if (value === undefined) {
            return res.status(400).json({
                success: false,
                error: 'value alanı zorunludur'
            });
        }

        const reading = await SensorData.create({
            sensorId: id,
            value,
            unit: sensor.unit,
            timestamp: timestamp ? new Date(timestamp) : new Date()
        });

        // Update sensor's last reading
        sensor.lastReading = value;
        sensor.lastReadingAt = reading.timestamp;
        await sensor.save();

        // Check threshold and broadcast alert if needed
        const isWithinThreshold = sensor.isWithinThreshold(value);
        if (!isWithinThreshold) {
            const socketService = req.app.get('socketService');
            if (socketService) {
                socketService.broadcastSensorAlert(sensor, value);
            }
        }

        // Broadcast the reading via WebSocket
        const socketService = req.app.get('socketService');
        if (socketService) {
            socketService.broadcastSensorReading(id, {
                value,
                unit: sensor.unit,
                timestamp: reading.timestamp,
                isWithinThreshold
            });
        }

        res.status(201).json({
            success: true,
            message: 'Okuma kaydedildi',
            data: {
                reading,
                isWithinThreshold
            }
        });
    } catch (error) {
        console.error('Add Reading Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * Get sensor statistics
 * GET /api/v1/sensors/stats/summary
 */
exports.getSensorStats = async (req, res) => {
    try {
        const totalSensors = await Sensor.count();
        const activeSensors = await Sensor.count({ where: { status: 'active' } });
        const inactiveSensors = await Sensor.count({ where: { status: 'inactive' } });
        const maintenanceSensors = await Sensor.count({ where: { status: 'maintenance' } });

        // Sensors by type
        const sensorsByType = await Sensor.findAll({
            attributes: ['type', [fn('COUNT', col('id')), 'count']],
            group: ['type'],
            raw: true
        });

        // Readings in last 24 hours
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const readingsLast24h = await SensorData.count({
            where: { timestamp: { [Op.gte]: oneDayAgo } }
        });

        // Sensors with threshold alerts
        const sensorsWithAlerts = await Sensor.findAll({
            where: {
                status: 'active',
                lastReading: { [Op.ne]: null }
            }
        });

        const alertCount = sensorsWithAlerts.filter(s => !s.isWithinThreshold(s.lastReading)).length;

        res.json({
            success: true,
            data: {
                totalSensors,
                activeSensors,
                inactiveSensors,
                maintenanceSensors,
                sensorsByType,
                readingsLast24h,
                alertCount
            }
        });
    } catch (error) {
        console.error('Get Sensor Stats Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
