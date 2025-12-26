const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize, User, Student, Enrollment, CourseSection, Course, Department } = require('../src/models');
const { Op } = require('sequelize');

const run = async () => {
    try {
        console.log('🧹 Starting enrollment cleanup...');

        // 1. Get all students with their departments
        const students = await Student.findAll({
            include: [{ model: Department, as: 'department' }]
        });

        console.log(`👥 Found ${students.length} students.`);

        for (const student of students) {
            if (!student.departmentId) {
                console.warn(`⚠️ Student ${student.studentNumber} has no department. Skipping.`);
                continue;
            }

            console.log(`Processing Student: ${student.studentNumber} (Dept: ${student.department.name})`);

            // 2. Get all enrollments for this student
            const enrollments = await Enrollment.findAll({
                where: { studentId: student.userId },
                include: [{
                    model: CourseSection,
                    as: 'section',
                    include: [{ model: Course, as: 'course' }]
                }]
            });

            for (const enrollment of enrollments) {
                if (!enrollment.section || !enrollment.section.course) {
                    console.warn(`⚠️ Enrollment ${enrollment.id} has missing course/section data. Deleting.`);
                    await enrollment.destroy();
                    continue;
                }

                const courseDepartmentId = enrollment.section.course.departmentId;

                // 3. Check for Department Mismatch
                if (courseDepartmentId !== student.departmentId) {
                    console.log(`❌ Invalid Course: ${enrollment.section.course.code} (Dept Mismatch). Deleting...`);
                    await enrollment.destroy();
                } else {
                    // 4. Valid Department - Reset Grades (because they were randomly assigned)
                    // Only reset if they look "seeded" (e.g. all set).
                    // Or just reset all to be safe as per user request.
                    if (enrollment.midtermGrade !== null || enrollment.finalGrade !== null) {
                        console.log(`🔄 Resetting grades for: ${enrollment.section.course.code}`);
                        await enrollment.update({
                            midtermGrade: null,
                            finalGrade: null,
                            letterGrade: null,
                            gradePoint: null
                        });
                    }
                }
            }
        }

        console.log('✅ Cleanup completed successfully.');

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        await sequelize.close();
    }
};

const init = async () => {
    try {
        await sequelize.authenticate();
        await run();
    } catch (e) {
        console.error('❌ DB Connection failed:', e.message);
    }
}

init();
