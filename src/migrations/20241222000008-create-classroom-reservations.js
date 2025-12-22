'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('classroom_reservations', {
      id: {
        type: Sequelize.CHAR(36),
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
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
      classroomId: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'classrooms',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      startTime: {
        type: Sequelize.TIME,
        allowNull: false
      },
      endTime: {
        type: Sequelize.TIME,
        allowNull: false
      },
      purpose: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
      },
      rejectedReason: {
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
    await queryInterface.addIndex('classroom_reservations', ['userId']);
    await queryInterface.addIndex('classroom_reservations', ['classroomId']);
    await queryInterface.addIndex('classroom_reservations', ['date']);
    await queryInterface.addIndex('classroom_reservations', ['status']);
    
    // Composite index for checking conflicts
    await queryInterface.addIndex('classroom_reservations', ['classroomId', 'date', 'startTime', 'endTime'], {
      name: 'classroom_reservations_conflict_check'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('classroom_reservations');
  }
};

