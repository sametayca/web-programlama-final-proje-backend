const cron = require('node-cron');
const { Sensor, SensorData } = require('../models');
const logger = require('../config/logger');

/**
 * Sensor Simulator
 * Simulates IoT sensor data for demo purposes
 */
class SensorSimulator {
    constructor() {
        this.isRunning = false;
        this.interval = null;
    }

    /**
     * Generate random value within a range
     */
    randomValue(min, max, decimals = 2) {
        const value = Math.random() * (max - min) + min;
        return parseFloat(value.toFixed(decimals));
    }

    /**
     * Generate realistic temperature reading
     * Varies based on time of day
     */
    generateTemperature(baseTemp = 22) {
        const hour = new Date().getHours();
        // Warmer during day, cooler at night
        const timeAdjustment = hour >= 9 && hour <= 17 ? 2 : -1;
        const randomVariation = this.randomValue(-1, 1);
        return baseTemp + timeAdjustment + randomVariation;
    }

    /**
     * Generate realistic occupancy reading
     * Based on time of day and day of week
     */
    generateOccupancy(maxCapacity = 100) {
        const hour = new Date().getHours();
        const day = new Date().getDay(); // 0 = Sunday

        // Weekends have lower occupancy
        if (day === 0 || day === 6) {
            return Math.floor(this.randomValue(0, maxCapacity * 0.3));
        }

        // Peak hours: 9-12, 13-17
        if ((hour >= 9 && hour <= 12) || (hour >= 13 && hour <= 17)) {
            return Math.floor(this.randomValue(maxCapacity * 0.5, maxCapacity * 0.9));
        }

        // Off-peak
        return Math.floor(this.randomValue(0, maxCapacity * 0.3));
    }

    /**
     * Generate realistic energy reading (kW)
     */
    generateEnergy(baseConsumption = 50) {
        const hour = new Date().getHours();

        // Higher consumption during working hours
        if (hour >= 8 && hour <= 20) {
            return this.randomValue(baseConsumption * 0.8, baseConsumption * 1.2);
        }

        // Lower consumption at night
        return this.randomValue(baseConsumption * 0.2, baseConsumption * 0.4);
    }

    /**
     * Generate realistic humidity reading
     */
    generateHumidity(baseHumidity = 45) {
        return this.randomValue(baseHumidity - 10, baseHumidity + 10);
    }

    /**
     * Generate reading based on sensor type
     */
    generateReading(sensor) {
        switch (sensor.type) {
            case 'temperature':
                return this.generateTemperature();
            case 'occupancy':
                return this.generateOccupancy(sensor.maxThreshold || 100);
            case 'energy':
                return this.generateEnergy();
            case 'humidity':
                return this.generateHumidity();
            default:
                return this.randomValue(0, 100);
        }
    }

    /**
     * Create readings for all active sensors
     */
    async createReadings() {
        if (this.isRunning) return;

        this.isRunning = true;

        try {
            const sensors = await Sensor.findAll({
                where: { status: 'active' }
            });

            for (const sensor of sensors) {
                const value = this.generateReading(sensor);

                // Create sensor data entry
                await SensorData.create({
                    sensorId: sensor.id,
                    value,
                    unit: sensor.unit,
                    timestamp: new Date()
                });

                // Update sensor's last reading
                sensor.lastReading = value;
                sensor.lastReadingAt = new Date();
                await sensor.save();

                // Broadcast via WebSocket if available
                const socketService = require('../config/socket');
                if (socketService && socketService.broadcastSensorReading) {
                    socketService.broadcastSensorReading(sensor.id, {
                        value,
                        unit: sensor.unit,
                        timestamp: new Date(),
                        isWithinThreshold: sensor.isWithinThreshold(value)
                    });

                    // Send alert if threshold exceeded
                    if (!sensor.isWithinThreshold(value)) {
                        socketService.broadcastSensorAlert(sensor, value);
                    }
                }
            }

            logger.debug(`Generated readings for ${sensors.length} sensors`);
        } catch (error) {
            logger.error('Sensor simulator error:', error.message);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Create demo sensors if none exist
     */
    async ensureDemoSensors() {
        try {
            const count = await Sensor.count();
            if (count > 0) {
                logger.info(`Found ${count} existing sensors`);
                return;
            }

            const demoSensors = [
                // Temperature sensors
                { name: 'Sınıf A101 Sıcaklık', type: 'temperature', location: 'A Blok, Kat 1, Sınıf 101', unit: '°C', minThreshold: 18, maxThreshold: 26 },
                { name: 'Sınıf A102 Sıcaklık', type: 'temperature', location: 'A Blok, Kat 1, Sınıf 102', unit: '°C', minThreshold: 18, maxThreshold: 26 },
                { name: 'Kütüphane Sıcaklık', type: 'temperature', location: 'Kütüphane, Ana Salon', unit: '°C', minThreshold: 20, maxThreshold: 24 },

                // Occupancy sensors
                { name: 'Kütüphane Doluluk', type: 'occupancy', location: 'Kütüphane, Giriş', unit: 'kişi', minThreshold: 0, maxThreshold: 200 },
                { name: 'Kafeterya Doluluk', type: 'occupancy', location: 'Kafeterya, Ana Salon', unit: 'kişi', minThreshold: 0, maxThreshold: 300 },
                { name: 'Spor Salonu Doluluk', type: 'occupancy', location: 'Spor Kompleksi, Ana Salon', unit: 'kişi', minThreshold: 0, maxThreshold: 100 },

                // Energy sensors
                { name: 'A Blok Enerji', type: 'energy', location: 'A Blok, Elektrik Odası', unit: 'kW', minThreshold: 0, maxThreshold: 150 },
                { name: 'B Blok Enerji', type: 'energy', location: 'B Blok, Elektrik Odası', unit: 'kW', minThreshold: 0, maxThreshold: 120 },

                // Humidity sensors
                { name: 'Laboratuvar Nem', type: 'humidity', location: 'C Blok, Kat 2, Lab 201', unit: '%', minThreshold: 30, maxThreshold: 60 }
            ];

            for (const sensorData of demoSensors) {
                await Sensor.create({
                    ...sensorData,
                    status: 'active'
                });
            }

            logger.info(`Created ${demoSensors.length} demo sensors`);
            console.log(`✅ Created ${demoSensors.length} demo sensors`);
        } catch (error) {
            logger.error('Failed to create demo sensors:', error.message);
        }
    }

    /**
     * Start the simulator
     */
    async start() {
        // Ensure demo sensors exist
        await this.ensureDemoSensors();

        // Generate readings every 30 seconds
        this.interval = setInterval(() => {
            this.createReadings();
        }, 30000);

        // Generate initial readings
        await this.createReadings();

        logger.info('✅ Sensor simulator started (every 30 seconds)');
        console.log('✅ Sensor simulator started (every 30 seconds)');
    }

    /**
     * Stop the simulator
     */
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        logger.info('Sensor simulator stopped');
    }
}

module.exports = new SensorSimulator();
