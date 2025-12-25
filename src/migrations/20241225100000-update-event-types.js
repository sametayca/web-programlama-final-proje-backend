'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. Add new enum types to eventType
        // Postgres doesn't support ALTER TYPE ADD VALUE easily inside transaction in some versions,
        // but we can try to hack it or replace the type. The safest way is to replace the type.

        // However, Sequelize might not handle ENUM updates automatically.
        // We will use raw SQL for Postgres to add values if not exists.
        try {
            await queryInterface.sequelize.query("ALTER TYPE \"enum_events_eventType\" ADD VALUE IF NOT EXISTS 'academic'");
            await queryInterface.sequelize.query("ALTER TYPE \"enum_events_eventType\" ADD VALUE IF NOT EXISTS 'exam'");
            await queryInterface.sequelize.query("ALTER TYPE \"enum_events_eventType\" ADD VALUE IF NOT EXISTS 'holiday'");
            await queryInterface.sequelize.query("ALTER TYPE \"enum_events_eventType\" ADD VALUE IF NOT EXISTS 'registration'");
            await queryInterface.sequelize.query("ALTER TYPE \"enum_events_eventType\" ADD VALUE IF NOT EXISTS 'ceremony'");
        } catch (e) {
            console.log('Enum update error (might be already added):', e);
        }

        // 2. Add priority column
        await queryInterface.addColumn('events', 'priority', {
            type: Sequelize.ENUM('low', 'normal', 'high', 'urgent'),
            defaultValue: 'normal',
            allowNull: false
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Reverting enums is hard in Postgres, we skip that safely.
        await queryInterface.removeColumn('events', 'priority');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_events_priority";');
    }
};
