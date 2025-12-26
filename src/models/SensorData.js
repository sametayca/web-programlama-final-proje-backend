module.exports = (sequelize, DataTypes) => {
    const SensorData = sequelize.define('SensorData', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },
        sensorId: {
            type: DataTypes.STRING(36),
            allowNull: false,
            field: 'sensor_id'
        },
        value: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        unit: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        timestamp: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'sensor_data',
        underscored: true,
        timestamps: true,
        updatedAt: false // Only createdAt for time-series data
    });

    SensorData.associate = function (models) {
        SensorData.belongsTo(models.Sensor, {
            foreignKey: 'sensorId',
            as: 'sensor'
        });
    };

    return SensorData;
};
