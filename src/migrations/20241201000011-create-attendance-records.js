'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('attendance_records', {
      id: {
        type: Sequelize.CHAR(36),
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      sessionId: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'attendance_sessions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      studentId: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      checkInTime: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: false,
        comment: 'Student GPS latitude at check-in'
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: false,
        comment: 'Student GPS longitude at check-in'
      },
      accuracy: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: true,
        comment: 'GPS accuracy in meters'
      },
      distanceFromCenter: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: false,
        comment: 'Distance from classroom center in meters'
      },
      isFlagged: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Flagged for GPS spoofing suspicion'
      },
      flagReason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Reason for flagging'
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

    await queryInterface.addIndex('attendance_records', ['sessionId', 'studentId'], {
      unique: true,
      name: 'attendance_records_session_student_unique'
    });

    await queryInterface.addIndex('attendance_records', ['sessionId']);
    await queryInterface.addIndex('attendance_records', ['studentId']);
    await queryInterface.addIndex('attendance_records', ['isFlagged']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('attendance_records');
  }
};

