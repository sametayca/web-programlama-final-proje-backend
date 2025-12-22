'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cafeterias', {
      id: {
        type: Sequelize.CHAR(36),
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      location: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 100
      },
      openingTime: {
        type: Sequelize.TIME,
        allowNull: false
      },
      closingTime: {
        type: Sequelize.TIME,
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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
    await queryInterface.addIndex('cafeterias', ['isActive']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('cafeterias');
  }
};

