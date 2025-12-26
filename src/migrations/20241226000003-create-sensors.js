'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('sensors', {
            id: {
                type: Sequelize.CHAR(36),
                primaryKey: true
            },
            name: {
                type: Sequelize.STRING(100),
                allowNull: false
            },
            type: {
                type: Sequelize.ENUM('temperature', 'occupancy', 'energy', 'humidity'),
                allowNull: false
            },
            location: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            unit: {
                type: Sequelize.STRING(20),
                allowNull: false
            },
            status: {
                type: Sequelize.ENUM('active', 'inactive', 'maintenance'),
                defaultValue: 'active'
            },
            last_reading: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true
            },
            last_reading_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            min_threshold: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true
            },
            max_threshold: {
                type: Sequelize.DECIMAL(10, 2),
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

        // Add indexes
        await queryInterface.addIndex('sensors', ['type', 'status']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('sensors');
    }
};
