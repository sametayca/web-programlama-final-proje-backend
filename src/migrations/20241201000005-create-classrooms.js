'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('classrooms', {
      id: {
        type: Sequelize.CHAR(36),
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      building: {
        type: Sequelize.STRING,
        allowNull: false
      },
      roomNumber: {
        type: Sequelize.STRING,
        allowNull: false
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 30
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: false,
        comment: 'GPS latitude coordinate'
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: false,
        comment: 'GPS longitude coordinate'
      },
      featuresJson: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'JSON object with features like projector, whiteboard, etc.'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Unique constraint for building + roomNumber
    await queryInterface.addIndex('classrooms', ['building', 'roomNumber'], {
      unique: true,
      name: 'classrooms_building_room_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('classrooms');
  }
};

