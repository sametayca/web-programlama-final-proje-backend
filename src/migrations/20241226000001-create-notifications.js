'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('notifications', {
            id: {
                type: Sequelize.CHAR(36),
                primaryKey: true
            },
            user_id: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            title: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            message: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            category: {
                type: Sequelize.ENUM('academic', 'attendance', 'meal', 'event', 'payment', 'system'),
                defaultValue: 'system'
            },
            type: {
                type: Sequelize.ENUM('info', 'warning', 'success', 'error'),
                defaultValue: 'info'
            },
            is_read: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            link: {
                type: Sequelize.STRING(500),
                allowNull: true
            },
            metadata: {
                type: Sequelize.JSONB,
                allowNull: true
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

        // Add indexes for performance
        await queryInterface.addIndex('notifications', ['user_id', 'is_read']);
        await queryInterface.addIndex('notifications', ['user_id', 'category']);
        await queryInterface.addIndex('notifications', ['created_at']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('notifications');
    }
};
