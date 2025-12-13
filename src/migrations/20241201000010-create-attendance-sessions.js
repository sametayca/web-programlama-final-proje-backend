'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('attendance_sessions', {
      id: {
        type: Sequelize.CHAR(36),
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      sectionId: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'course_sections',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      instructorId: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
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
      geofenceRadius: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: false,
        defaultValue: 15.00,
        comment: 'Geofence radius in meters'
      },
      qrCode: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
        comment: 'Unique QR code for backup attendance method'
      },
      qrCodeExpiresAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'QR code expiration time'
      },
      status: {
        type: Sequelize.ENUM('active', 'closed'),
        allowNull: false,
        defaultValue: 'active'
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

    await queryInterface.addIndex('attendance_sessions', ['sectionId']);
    await queryInterface.addIndex('attendance_sessions', ['instructorId']);
    await queryInterface.addIndex('attendance_sessions', ['qrCode'], {
      unique: true,
      name: 'attendance_sessions_qr_code_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('attendance_sessions');
  }
};

