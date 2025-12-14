'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('announcements', {
      id: {
        type: Sequelize.CHAR(36),
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      authorId: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      isPinned: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      targetAudience: {
        type: Sequelize.ENUM('all', 'students', 'faculty', 'staff'),
        defaultValue: 'all',
        allowNull: false
      },
      priority: {
        type: Sequelize.ENUM('low', 'normal', 'high', 'urgent'),
        defaultValue: 'normal',
        allowNull: false
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: true
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

    // Add indexes
    await queryInterface.addIndex('announcements', ['authorId']);
    await queryInterface.addIndex('announcements', ['isPinned']);
    await queryInterface.addIndex('announcements', ['isActive']);
    await queryInterface.addIndex('announcements', ['targetAudience']);
    await queryInterface.addIndex('announcements', ['priority']);
    await queryInterface.addIndex('announcements', ['createdAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('announcements');
  }
};
