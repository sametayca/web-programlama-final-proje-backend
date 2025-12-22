'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('meal_reservations', {
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
      menuId: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'meal_menus',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      reservationDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      qrCode: {
        type: Sequelize.STRING(36),
        allowNull: false,
        unique: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'used', 'cancelled', 'expired'),
        allowNull: false,
        defaultValue: 'pending'
      },
      usedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      amountPaid: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      isScholarshipMeal: {
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
    await queryInterface.addIndex('meal_reservations', ['studentId']);
    await queryInterface.addIndex('meal_reservations', ['menuId']);
    await queryInterface.addIndex('meal_reservations', ['qrCode']);
    await queryInterface.addIndex('meal_reservations', ['status']);
    await queryInterface.addIndex('meal_reservations', ['reservationDate']);
    
    // Composite index for student daily meal count check
    await queryInterface.addIndex('meal_reservations', ['studentId', 'reservationDate', 'status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('meal_reservations');
  }
};

