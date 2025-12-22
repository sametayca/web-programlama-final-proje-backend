'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('schedules', {
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
      classroomId: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'classrooms',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      day: {
        type: Sequelize.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
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
      semester: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      year: {
        type: Sequelize.INTEGER,
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
    await queryInterface.addIndex('schedules', ['sectionId']);
    await queryInterface.addIndex('schedules', ['classroomId']);
    await queryInterface.addIndex('schedules', ['day']);
    await queryInterface.addIndex('schedules', ['semester', 'year']);
    
    // Unique constraint: section can only have one schedule per semester
    await queryInterface.addIndex('schedules', ['sectionId', 'semester', 'year'], {
      unique: true,
      name: 'unique_section_semester_year'
    });
    
    // Composite index for conflict checking
    await queryInterface.addIndex('schedules', ['classroomId', 'day', 'startTime', 'endTime']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('schedules');
  }
};

