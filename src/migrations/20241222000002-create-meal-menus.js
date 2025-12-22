'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('meal_menus', {
      id: {
        type: Sequelize.CHAR(36),
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      cafeteriaId: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'cafeterias',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      mealType: {
        type: Sequelize.ENUM('breakfast', 'lunch', 'dinner'),
        allowNull: false
      },
      menuDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      mainCourse: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      sideDish: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      soup: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      salad: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      dessert: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      availableQuota: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 100
      },
      reservedCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
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
    await queryInterface.addIndex('meal_menus', ['cafeteriaId']);
    await queryInterface.addIndex('meal_menus', ['menuDate', 'mealType']);
    await queryInterface.addIndex('meal_menus', ['isActive']);
    
    // Add unique constraint for cafeteria + date + mealType
    await queryInterface.addConstraint('meal_menus', {
      fields: ['cafeteriaId', 'menuDate', 'mealType'],
      type: 'unique',
      name: 'unique_cafeteria_date_mealtype'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('meal_menus');
  }
};

