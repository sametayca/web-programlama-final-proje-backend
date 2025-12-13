'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('excuse_requests', {
      id: {
        type: Sequelize.CHAR(36),
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
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
      reason: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      documentUrl: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'URL to uploaded document'
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
      },
      reviewedBy: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      reviewedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Reviewer notes'
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

    await queryInterface.addIndex('excuse_requests', ['studentId', 'sessionId'], {
      unique: true,
      name: 'excuse_requests_student_session_unique'
    });

    await queryInterface.addIndex('excuse_requests', ['studentId']);
    await queryInterface.addIndex('excuse_requests', ['sessionId']);
    await queryInterface.addIndex('excuse_requests', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('excuse_requests');
  }
};

