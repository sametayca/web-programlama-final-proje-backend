'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('courses', {
      id: {
        type: Sequelize.CHAR(36),
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Course code (e.g., CS101)'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      credits: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 3
      },
      ects: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5
      },
      syllabusUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      departmentId: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'departments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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

    await queryInterface.addIndex('courses', ['code'], {
      unique: true,
      name: 'courses_code_unique'
    });

    await queryInterface.addIndex('courses', ['departmentId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('courses');
  }
};

