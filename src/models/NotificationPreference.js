const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
    const NotificationPreference = sequelize.define('NotificationPreference', {
        id: {
            type: DataTypes.STRING(36),
            defaultValue: () => uuidv4(),
            primaryKey: true
        },
        userId: {
            type: DataTypes.STRING(36),
            allowNull: false,
            unique: true,
            field: 'user_id'
        },
        // Email preferences
        emailAcademic: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'email_academic'
        },
        emailAttendance: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'email_attendance'
        },
        emailMeal: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'email_meal'
        },
        emailEvent: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'email_event'
        },
        emailPayment: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'email_payment'
        },
        emailSystem: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'email_system'
        },
        // Push preferences
        pushAcademic: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'push_academic'
        },
        pushAttendance: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'push_attendance'
        },
        pushMeal: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'push_meal'
        },
        pushEvent: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'push_event'
        },
        pushPayment: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'push_payment'
        },
        pushSystem: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'push_system'
        },
        // SMS preferences
        smsAttendance: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'sms_attendance'
        },
        smsPayment: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'sms_payment'
        }
    }, {
        tableName: 'notification_preferences',
        underscored: true,
        timestamps: true
    });

    NotificationPreference.associate = function (models) {
        NotificationPreference.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    // Helper method to get preferences in grouped format
    NotificationPreference.prototype.toGroupedFormat = function () {
        return {
            email: {
                academic: this.emailAcademic,
                attendance: this.emailAttendance,
                meal: this.emailMeal,
                event: this.emailEvent,
                payment: this.emailPayment,
                system: this.emailSystem
            },
            push: {
                academic: this.pushAcademic,
                attendance: this.pushAttendance,
                meal: this.pushMeal,
                event: this.pushEvent,
                payment: this.pushPayment,
                system: this.pushSystem
            },
            sms: {
                attendance: this.smsAttendance,
                payment: this.smsPayment
            }
        };
    };

    return NotificationPreference;
};
