'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('notification_preferences', {
            id: {
                type: Sequelize.CHAR(36),
                primaryKey: true
            },
            user_id: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                unique: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            // Email notification preferences
            email_academic: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            email_attendance: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            email_meal: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            email_event: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            email_payment: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            email_system: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            // Push notification preferences
            push_academic: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            push_attendance: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            push_meal: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            push_event: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            push_payment: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            push_system: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            // SMS notification preferences (limited categories)
            sms_attendance: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            sms_payment: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            }
        });

        // Add index for user lookup
        await queryInterface.addIndex('notification_preferences', ['user_id']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('notification_preferences');
    }
};
