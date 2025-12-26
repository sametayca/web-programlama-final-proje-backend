const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
    const Notification = sequelize.define('Notification', {
        id: {
            type: DataTypes.STRING(36),
            defaultValue: () => uuidv4(),
            primaryKey: true
        },
        userId: {
            type: DataTypes.STRING(36),
            allowNull: false,
            field: 'user_id'
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        category: {
            type: DataTypes.ENUM('academic', 'attendance', 'meal', 'event', 'payment', 'system'),
            defaultValue: 'system'
        },
        type: {
            type: DataTypes.ENUM('info', 'warning', 'success', 'error'),
            defaultValue: 'info'
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_read'
        },
        link: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        metadata: {
            type: DataTypes.JSONB,
            allowNull: true
        }
    }, {
        tableName: 'notifications',
        underscored: true,
        timestamps: true
    });

    Notification.associate = function (models) {
        Notification.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    return Notification;
};
