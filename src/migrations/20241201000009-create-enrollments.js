'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('enrollments', {
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
      status: {
        type: Sequelize.ENUM('enrolled', 'completed', 'dropped', 'failed'),
        allowNull: false,
        defaultValue: 'enrolled'
      },
      enrollmentDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      midtermGrade: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Midterm grade (0-100)'
      },
      finalGrade: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Final grade (0-100)'
      },
      letterGrade: {
        type: Sequelize.ENUM('A', 'B', 'C', 'D', 'F', 'I', 'W'),
        allowNull: true,
        comment: 'Letter grade'
      },
      gradePoint: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
        comment: 'Grade point (0.00-4.00)'
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

    await queryInterface.addIndex('enrollments', ['studentId', 'sectionId'], {
      unique: true,
      name: 'enrollments_student_section_unique'
    });

    await queryInterface.addIndex('enrollments', ['studentId']);
    await queryInterface.addIndex('enrollments', ['sectionId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('enrollments');
  }
};

