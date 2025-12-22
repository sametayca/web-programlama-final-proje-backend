'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transactions', {
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
      type: {
        type: Sequelize.ENUM('deposit', 'withdrawal', 'meal_payment', 'refund'),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      balanceBefore: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      balanceAfter: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      description: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      referenceId: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        comment: 'Reference to meal_reservation or other entity'
      },
      referenceType: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Type of reference: meal_reservation, manual, etc.'
      },
      createdBy: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.addIndex('transactions', ['studentId']);
    await queryInterface.addIndex('transactions', ['type']);
    await queryInterface.addIndex('transactions', ['referenceId', 'referenceType']);
    await queryInterface.addIndex('transactions', ['createdAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('transactions');
  }
};

