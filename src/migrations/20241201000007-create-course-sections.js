'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('course_sections', {
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
      sectionNumber: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      semester: {
        type: Sequelize.ENUM('fall', 'spring', 'summer'),
        allowNull: false
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false
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
      classroomId: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: {
          model: 'classrooms',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 30
      },
      enrolledCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      scheduleJson: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'JSON object with schedule info (days, startTime, endTime)'
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

    await queryInterface.addIndex('course_sections', ['courseId', 'sectionNumber', 'semester', 'year'], {
      unique: true,
      name: 'course_sections_unique'
    });

    await queryInterface.addIndex('course_sections', ['instructorId']);
    await queryInterface.addIndex('course_sections', ['classroomId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('course_sections');
  }
};

