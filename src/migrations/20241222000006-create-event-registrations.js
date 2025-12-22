'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('event_registrations', {
      id: {
        type: Sequelize.CHAR(36),
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      eventId: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'events',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      qrCode: {
        type: Sequelize.STRING(36),
        allowNull: false,
        unique: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'cancelled'),
        allowNull: false,
        defaultValue: 'approved'
      },
      checkedIn: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      checkedInAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      registeredAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
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
    await queryInterface.addIndex('event_registrations', ['eventId']);
    await queryInterface.addIndex('event_registrations', ['userId']);
    await queryInterface.addIndex('event_registrations', ['qrCode']);
    await queryInterface.addIndex('event_registrations', ['status']);
    await queryInterface.addIndex('event_registrations', ['checkedIn']);
    
    // Composite index for preventing duplicate registrations
    await queryInterface.addIndex('event_registrations', ['eventId', 'userId'], {
      unique: true,
      name: 'unique_event_user_registration'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('event_registrations');
  }
};

