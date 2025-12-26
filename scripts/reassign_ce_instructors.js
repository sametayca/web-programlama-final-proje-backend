const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });



const { sequelize, User, Course, Department, CourseSection, Faculty } = require('../src/models');
const bcrypt = require('bcryptjs');

const run = async () => {
    try {
        // 1. Find Computer Engineering Department
        const departmentName = 'Computer Engineering';
        const department = await Department.findOne({
            where: sequelize.where(
                sequelize.fn('lower', sequelize.col('name')),
                sequelize.fn('lower', departmentName)
            )
        });

        if (!department) {
            console.error(`❌ Department '${departmentName}' not found.`);
            const departmentTr = await Department.findOne({
                where: sequelize.where(
                    sequelize.fn('lower', sequelize.col('name')),
                    'bilgisayar mühendisliği'
                )
            });
            if (departmentTr) {
                console.log(`✅ Department found: ${departmentTr.name}`);
                await processDepartment(departmentTr);
            } else {
                console.log('Trying to find ANY department to show what exists...');
                const deps = await Department.findAll({ limit: 5 });
                console.log('Available departments:', deps.map(d => d.name));
                process.exit(1);
            }
        } else {
            console.log(`✅ Department found: ${department.name}`);
            await processDepartment(department);
        }

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
};

const processDepartment = async (department) => {
    // 2. Find all courses in this department
    const courses = await Course.findAll({
        where: { departmentId: department.id }
    });

    console.log(`📚 Found ${courses.length} courses in ${department.name}`);
    console.log('---------------------------------------------------------');
    console.log('| Course Code | Instructor Name | Email | Password |');
    console.log('---------------------------------------------------------');

    for (const course of courses) {
        // 3. Create unique instructor for this course
        const instructorEmail = `dr.${course.code.toLowerCase()}@university.edu`;
        const plainPassword = 'password123';
        const passwordHash = await bcrypt.hash(plainPassword, 10);
        const firstName = 'Dr.';
        const lastName = course.code;

        const [user, created] = await User.findOrCreate({
            where: { email: instructorEmail },
            defaults: {
                firstName,
                lastName,
                email: instructorEmail,
                password: passwordHash,
                role: 'faculty',
                isEmailVerified: true
            }
        });

        if (created) {
            // Create faculty profile
            // Faculty model requires: userId, departmentId, employeeNumber, title
            await Faculty.create({
                userId: user.id,
                departmentId: department.id,
                employeeNumber: `FAC-${course.code}-${Math.floor(Math.random() * 1000)}`,
                title: 'assistant_professor', // Enum value from Faculty.js
                officeLocation: 'B-Block 301'
            });
        } else {
            await user.update({ password: passwordHash });
        }

        // 4. Assign this instructor to all sections of this course
        const sections = await CourseSection.findAll({
            where: { courseId: course.id }
        });

        for (const section of sections) {
            await section.update({ instructorId: user.id });
        }

        // Output credentials
        console.log(`| ${course.code.padEnd(11)} | ${`${firstName} ${lastName}`.padEnd(15)} | ${instructorEmail.padEnd(30)} | ${plainPassword} |`);
    }
    console.log('---------------------------------------------------------');
}

// Initialize DB and run
const init = async () => {
    await sequelize.authenticate();
    await run();
};

init();
