'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('sensor_data', {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                autoIncrement: true
            },
            sensor_id: {
                type: Sequelize.CHAR(36),
                allowNull: false,
                references: {
                    model: 'sensors',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            value: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            unit: {
                type: Sequelize.STRING(20),
                allowNull: false
            },
            timestamp: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            }
        });

        // Add indexes for time-series queries
        await queryInterface.addIndex('sensor_data', ['sensor_id', 'timestamp']);
        await queryInterface.addIndex('sensor_data', ['timestamp']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('sensor_data');
    }
};
