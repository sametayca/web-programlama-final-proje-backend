'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('course_prerequisites', {
      id: {
        type: Sequelize.CHAR(36),
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      courseId: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'courses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      prerequisiteCourseId: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'courses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    await queryInterface.addIndex('course_prerequisites', ['courseId', 'prerequisiteCourseId'], {
      unique: true,
      name: 'course_prerequisites_unique'
    });

    await queryInterface.addIndex('course_prerequisites', ['courseId']);
    await queryInterface.addIndex('course_prerequisites', ['prerequisiteCourseId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('course_prerequisites');
  }
};

