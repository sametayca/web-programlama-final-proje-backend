'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Add indexes for analytics performance on existing tables
        // Using raw SQL because Sequelize addIndex doesn't handle camelCase columns properly

        // meal_reservations - date and status for daily reporting
        try {
            await queryInterface.sequelize.query(`
                CREATE INDEX IF NOT EXISTS "meal_reservations_date_status_idx" 
                ON "meal_reservations" ("date", "status");
            `);
        } catch (e) {
            console.log('meal_reservations index failed:', e.message);
        }

        // event_registrations - event and status for analytics
        try {
            await queryInterface.sequelize.query(`
                CREATE INDEX IF NOT EXISTS "event_registrations_event_status_idx" 
                ON "event_registrations" ("eventId", "status");
            `);
        } catch (e) {
            console.log('event_registrations index failed:', e.message);
        }

        // attendance_records - for attendance rate calculations
        try {
            await queryInterface.sequelize.query(`
                CREATE INDEX IF NOT EXISTS "attendance_records_session_status_idx" 
                ON "attendance_records" ("sessionId", "status");
            `);
        } catch (e) {
            console.log('attendance_records index failed:', e.message);
        }

        // enrollments - for academic performance
        try {
            await queryInterface.sequelize.query(`
                CREATE INDEX IF NOT EXISTS "enrollments_section_status_idx" 
                ON "enrollments" ("sectionId", "status");
            `);
        } catch (e) {
            console.log('enrollments index failed:', e.message);
        }

        // events - for upcoming events queries
        try {
            await queryInterface.sequelize.query(`
                CREATE INDEX IF NOT EXISTS "events_date_status_idx" 
                ON "events" ("date", "status");
            `);
        } catch (e) {
            console.log('events index failed:', e.message);
        }

        // users - for active users count
        try {
            await queryInterface.sequelize.query(`
                CREATE INDEX IF NOT EXISTS "users_updated_at_idx" 
                ON "users" ("updatedAt");
            `);
        } catch (e) {
            console.log('users index failed:', e.message);
        }
    },

    async down(queryInterface, Sequelize) {
        try {
            await queryInterface.sequelize.query('DROP INDEX IF EXISTS "meal_reservations_date_status_idx";');
        } catch (e) { }
        try {
            await queryInterface.sequelize.query('DROP INDEX IF EXISTS "event_registrations_event_status_idx";');
        } catch (e) { }
        try {
            await queryInterface.sequelize.query('DROP INDEX IF EXISTS "attendance_records_session_status_idx";');
        } catch (e) { }
        try {
            await queryInterface.sequelize.query('DROP INDEX IF EXISTS "enrollments_section_status_idx";');
        } catch (e) { }
        try {
            await queryInterface.sequelize.query('DROP INDEX IF EXISTS "events_date_status_idx";');
        } catch (e) { }
        try {
            await queryInterface.sequelize.query('DROP INDEX IF EXISTS "users_updated_at_idx";');
        } catch (e) { }
    }
};
