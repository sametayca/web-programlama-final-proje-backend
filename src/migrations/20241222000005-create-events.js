'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('events', {
      id: {
        type: Sequelize.CHAR(36),
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      eventType: {
        type: Sequelize.ENUM('seminar', 'workshop', 'conference', 'social', 'sports', 'cultural', 'other'),
        allowNull: false,
        defaultValue: 'other'
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      location: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 50
      },
      registeredCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      organizer: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      organizerId: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      imageUrl: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      requiresApproval: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('events', ['startDate']);
    await queryInterface.addIndex('events', ['eventType']);
    await queryInterface.addIndex('events', ['isActive']);
    await queryInterface.addIndex('events', ['organizerId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('events');
  }
};

