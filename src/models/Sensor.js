const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
    const Sensor = sequelize.define('Sensor', {
        id: {
            type: DataTypes.STRING(36),
            defaultValue: () => uuidv4(),
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('temperature', 'occupancy', 'energy', 'humidity'),
            allowNull: false
        },
        location: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        unit: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
            defaultValue: 'active'
        },
        lastReading: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            field: 'last_reading'
        },
        lastReadingAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'last_reading_at'
        },
        minThreshold: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            field: 'min_threshold'
        },
        maxThreshold: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            field: 'max_threshold'
        },
        metadata: {
            type: DataTypes.JSONB,
            allowNull: true
        }
    }, {
        tableName: 'sensors',
        underscored: true,
        timestamps: true
    });

    Sensor.associate = function (models) {
        Sensor.hasMany(models.SensorData, {
            foreignKey: 'sensorId',
            as: 'readings'
        });
    };

    // Helper method to check if reading is within threshold
    Sensor.prototype.isWithinThreshold = function (value) {
        if (this.minThreshold === null && this.maxThreshold === null) {
            return true;
        }
        if (this.minThreshold !== null && value < parseFloat(this.minThreshold)) {
            return false;
        }
        if (this.maxThreshold !== null && value > parseFloat(this.maxThreshold)) {
            return false;
        }
        return true;
    };

    // Helper method to get status label
    Sensor.prototype.getStatusLabel = function () {
        const labels = {
            active: 'Aktif',
            inactive: 'Pasif',
            maintenance: 'Bakımda'
        };
        return labels[this.status] || this.status;
    };

    return Sensor;
};
