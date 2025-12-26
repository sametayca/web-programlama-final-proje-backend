'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Get Users (Students)
        const students = await queryInterface.sequelize.query(
            `SELECT id, "userId" FROM students;`,
            { type: Sequelize.QueryTypes.SELECT }
        );

        if (students.length === 0) {
            console.log('❌ No students found. Make sure validation seeders are run first.');
            return;
        }

        // 2. Get Meal Menus
        const menus = await queryInterface.sequelize.query(
            `SELECT id, "menuDate", "mealType", price FROM meal_menus;`,
            { type: Sequelize.QueryTypes.SELECT }
        );

        // 3. Get Events
        const events = await queryInterface.sequelize.query(
            `SELECT id, "startDate" FROM events;`,
            { type: Sequelize.QueryTypes.SELECT }
        );

        // 4. Get Course Sections
        const sections = await queryInterface.sequelize.query(
            `SELECT id FROM course_sections;`,
            { type: Sequelize.QueryTypes.SELECT }
        );

        // --- Create Meal Reservations ---
        const reservations = [];
        if (menus.length > 0) {
            for (const menu of menus) {
                // Randomly assign 0-5 students to each menu
                const randomStudents = students.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 5));

                for (const student of randomStudents) {
                    const statusOptions = ['pending', 'used', 'cancelled'];
                    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
                    const menuDate = new Date(menu.menuDate);

                    reservations.push({
                        id: uuidv4(),
                        studentId: student.userId, // MealReservation references users.id (which is student.userId)
                        menuId: menu.id,
                        reservationDate: menuDate,
                        qrCode: uuidv4(),
                        status: status,
                        usedAt: status === 'used' ? new Date(menuDate.setHours(12, 30)) : null,
                        amountPaid: menu.price,
                        isScholarshipMeal: Math.random() < 0.2,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                }
            }
            if (reservations.length > 0) {
                // bulkInsert might duplicate if run multiple times but IDs are random
                await queryInterface.bulkInsert('meal_reservations', reservations);
                console.log(`✅ Seeded ${reservations.length} meal reservations`);
            }
        }

        // --- Create Event Registrations ---
        const registrations = [];
        if (events.length > 0) {
            for (const event of events) {
                // Randomly assign 2-8 students to each event
                const randomStudents = students.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 8) + 2);

                for (const student of randomStudents) {
                    const isCheckedIn = Math.random() > 0.5;
                    registrations.push({
                        id: uuidv4(),
                        eventId: event.id,
                        userId: student.userId,
                        qrCode: uuidv4(),
                        status: 'approved',
                        checkedIn: isCheckedIn,
                        checkedInAt: isCheckedIn ? new Date(event.startDate) : null,
                        registeredAt: new Date(),
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                }
            }
            if (registrations.length > 0) {
                // Handle potential duplicates if keys exist? keys are UUIDs.
                // Unique index on eventId+userId exists. We need to handle that.
                // We will try bulkInsert, if fail we can wrap in try-catch in real code or verify first.
                // For seeder, since we select random students each run, collisions are possible but we can ignore for now or clear first.
                // We rely on "down" to clear, but we are running just "up".
                // Let's use INSERT ON CONFLICT via raw query or just assume clean slate.
                // Given errors earlier, use raw query loop for safety on unique constraint.
                for (const reg of registrations) {
                    try {
                        await queryInterface.sequelize.query(`
                INSERT INTO event_registrations (id, "eventId", "userId", "qrCode", status, "checkedIn", "checkedInAt", "registeredAt", "createdAt", "updatedAt")
                VALUES (:id, :eventId, :userId, :qrCode, :status, :checkedIn, :checkedInAt, :registeredAt, :createdAt, :updatedAt)
                ON CONFLICT DO NOTHING;
               `, { replacements: reg });
                    } catch (e) { }
                }
                console.log(`✅ Seeded event registrations`);
            }
        }

        // --- Create Enrollments and Grades ---
        // DISABLED: This was causing students to be enrolled in random courses outside their department with random grades.
        // const enrollments = [];
        // if (sections.length > 0) {
        //     for (const student of students) {
        //         // Enroll each student in 1-3 random sections
        //         const randomSections = sections.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1);

        //         for (const section of randomSections) {
        //             enrollments.push({
        //                 id: uuidv4(),
        //                 studentId: student.userId,
        //                 sectionId: section.id,
        //                 status: 'enrolled',
        //                 enrollmentDate: new Date(),
        //                 midtermGrade: Math.floor(Math.random() * 40) + 40, // 40-80
        //                 finalGrade: Math.floor(Math.random() * 50) + 50, // 50-100
        //                 letterGrade: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
        //                 gradePoint: (Math.random() * 2 + 2).toFixed(2), // 2.0 - 4.0
        //                 createdAt: new Date(),
        //                 updatedAt: new Date()
        //             });
        //         }
        //     }
        //     for (const enrollment of enrollments) {
        //         try {
        //             await queryInterface.sequelize.query(`
        //       INSERT INTO enrollments (id, "studentId", "sectionId", status, "enrollmentDate", "midtermGrade", "finalGrade", "letterGrade", "gradePoint", "createdAt", "updatedAt")
        //       VALUES (:id, :studentId, :sectionId, :status, :enrollmentDate, :midtermGrade, :finalGrade, :letterGrade, :gradePoint, :createdAt, :updatedAt)
        //       ON CONFLICT DO NOTHING;
        //     `, {
        //                 replacements: enrollment
        //             });
        //         } catch (e) {
        //             // Ignore
        //         }
        //     }
        //     console.log(`✅ Seeded enrollments`);
        // }

        // --- Create Attendance Sessions and Records ---
        // Get Faculty
        const faculty = await queryInterface.sequelize.query(
            `SELECT id FROM users WHERE role = 'faculty';`,
            { type: Sequelize.QueryTypes.SELECT }
        );

        if (sections.length > 0 && faculty.length > 0) {
            const attendanceSessions = [];
            const attendanceRecords = [];

            // Create 5 random sessions
            for (let i = 0; i < 5; i++) {
                const randomSection = sections[Math.floor(Math.random() * sections.length)];
                const randomFaculty = faculty[Math.floor(Math.random() * faculty.length)];

                const sessionId = uuidv4();
                const sessionDate = new Date();
                sessionDate.setDate(sessionDate.getDate() - Math.floor(Math.random() * 10)); // Last 10 days
                const dateStr = sessionDate.toISOString().split('T')[0];
                const startTime = '10:00:00';
                const endTime = '12:00:00';

                attendanceSessions.push({
                    id: sessionId,
                    sectionId: randomSection.id,
                    instructorId: randomFaculty.id,
                    date: dateStr,
                    startTime: startTime,
                    endTime: endTime,
                    latitude: 41.0082,
                    longitude: 28.9784,
                    geofenceRadius: 20.00,
                    qrCode: uuidv4(),
                    status: 'closed',
                    createdAt: sessionDate,
                    updatedAt: sessionDate
                });

                const randomPresentStudents = students.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 5) + 1);

                for (const student of randomPresentStudents) {
                    attendanceRecords.push({
                        id: uuidv4(),
                        sessionId: sessionId,
                        studentId: student.userId,
                        checkInTime: new Date(sessionDate.getTime() + Math.random() * 600000), // Checked in within 10 mins
                        latitude: 41.0082,
                        longitude: 28.9784,
                        distanceFromCenter: 10.5,
                        isFlagged: false,
                        createdAt: sessionDate,
                        updatedAt: sessionDate
                    });
                }
            }

            if (attendanceSessions.length > 0) {
                await queryInterface.bulkInsert('attendance_sessions', attendanceSessions);
                await queryInterface.bulkInsert('attendance_records', attendanceRecords);
                console.log(`✅ Seeded ${attendanceSessions.length} attendance sessions and ${attendanceRecords.length} records`);
            }
        }
    },

    async down(queryInterface, Sequelize) {
        // ...
    }
};
