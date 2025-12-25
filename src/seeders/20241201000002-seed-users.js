'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Hash password for all users
    const hashedPassword = await bcrypt.hash('Password123', 10);

    // Department IDs (use the same IDs from department seeder)
    const deptBM = '550e8400-e29b-41d4-a716-446655440001'; // Bilgisayar Mühendisliği
    const deptEE = '550e8400-e29b-41d4-a716-446655440002'; // Elektrik-Elektronik
    const deptME = '550e8400-e29b-41d4-a716-446655440003'; // Makine Mühendisliği

    // Users data
    const users = [
      // Admin User
      {
        id: '660e8400-e29b-41d4-a716-446655440001',
        email: 'admin@kampus.edu.tr',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        phone: '+905550000001',
        role: 'admin',
        isEmailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Students (5 adet)
      {
        id: '660e8400-e29b-41d4-a716-446655440002',
        email: 'student1@kampüs.edu.tr',
        password: hashedPassword,
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        phone: '+905550000101',
        role: 'student',
        isEmailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440003',
        email: 'student2@kampüs.edu.tr',
        password: hashedPassword,
        firstName: 'Ayşe',
        lastName: 'Demir',
        phone: '+905550000102',
        role: 'student',
        isEmailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440004',
        email: 'student3@kampüs.edu.tr',
        password: hashedPassword,
        firstName: 'Mehmet',
        lastName: 'Kaya',
        phone: '+905550000103',
        role: 'student',
        isEmailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440005',
        email: 'student4@kampüs.edu.tr',
        password: hashedPassword,
        firstName: 'Zeynep',
        lastName: 'Şahin',
        phone: '+905550000104',
        role: 'student',
        isEmailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440006',
        email: 'student5@kampüs.edu.tr',
        password: hashedPassword,
        firstName: 'Can',
        lastName: 'Özkan',
        phone: '+905550000105',
        role: 'student',
        isEmailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Faculty (2 adet)
      {
        id: '660e8400-e29b-41d4-a716-446655440007',
        email: 'faculty1@kampüs.edu.tr',
        password: hashedPassword,
        firstName: 'Prof. Dr.',
        lastName: 'Ali Veli',
        phone: '+905550000201',
        role: 'faculty',
        isEmailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440008',
        email: 'faculty2@kampüs.edu.tr',
        password: hashedPassword,
        firstName: 'Doç. Dr.',
        lastName: 'Fatma Nur',
        phone: '+905550000202',
        role: 'faculty',
        isEmailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert users
    for (const user of users) {
      await queryInterface.sequelize.query(`
        INSERT INTO users (id, email, password, "firstName", "lastName", phone, role, "isEmailVerified", "isActive", "createdAt", "updatedAt")
        VALUES (:id, :email, :password, :firstName, :lastName, :phone, :role, :isEmailVerified, :isActive, :createdAt, :updatedAt)
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          password = EXCLUDED.password,
          "firstName" = EXCLUDED."firstName",
          "lastName" = EXCLUDED."lastName",
          phone = EXCLUDED.phone,
          role = EXCLUDED.role,
          "isEmailVerified" = EXCLUDED."isEmailVerified",
          "isActive" = EXCLUDED."isActive",
          "updatedAt" = EXCLUDED."updatedAt"
      `, {
        replacements: user,
        type: Sequelize.QueryTypes.INSERT
      });
    }

    // Student profiles
    const students = [
      {
        id: '770e8400-e29b-41d4-a716-446655440001',
        userId: '660e8400-e29b-41d4-a716-446655440002',
        studentNumber: 'BM240001',
        departmentId: deptBM,
        enrollmentYear: 2024,
        gpa: 3.50,
        isScholarship: true,
        walletBalance: 1500.00,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '770e8400-e29b-41d4-a716-446655440002',
        userId: '660e8400-e29b-41d4-a716-446655440003',
        studentNumber: 'BM240002',
        departmentId: deptBM,
        enrollmentYear: 2024,
        gpa: 3.75,
        isScholarship: true,
        walletBalance: 2000.00,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '770e8400-e29b-41d4-a716-446655440003',
        userId: '660e8400-e29b-41d4-a716-446655440004',
        studentNumber: 'EE240001',
        departmentId: deptEE,
        enrollmentYear: 2024,
        gpa: 3.25,
        isScholarship: false,
        walletBalance: 500.00,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '770e8400-e29b-41d4-a716-446655440004',
        userId: '660e8400-e29b-41d4-a716-446655440005',
        studentNumber: 'EE240002',
        departmentId: deptEE,
        enrollmentYear: 2023,
        gpa: 3.90,
        isScholarship: true,
        walletBalance: 2500.00,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '770e8400-e29b-41d4-a716-446655440005',
        userId: '660e8400-e29b-41d4-a716-446655440006',
        studentNumber: 'ME240001',
        departmentId: deptME,
        enrollmentYear: 2024,
        gpa: 2.80,
        isScholarship: false,
        walletBalance: 300.00,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert students
    for (const student of students) {
      await queryInterface.sequelize.query(`
        INSERT INTO students (id, "userId", "studentNumber", "departmentId", "enrollmentYear", gpa, "isScholarship", "walletBalance", "createdAt", "updatedAt")
        VALUES (:id, :userId, :studentNumber, :departmentId, :enrollmentYear, :gpa, :isScholarship, :walletBalance, :createdAt, :updatedAt)
        ON CONFLICT (id) DO UPDATE SET
          "studentNumber" = EXCLUDED."studentNumber",
          "departmentId" = EXCLUDED."departmentId",
          "enrollmentYear" = EXCLUDED."enrollmentYear",
          gpa = EXCLUDED.gpa,
          "isScholarship" = EXCLUDED."isScholarship",
          "walletBalance" = EXCLUDED."walletBalance",
          "updatedAt" = EXCLUDED."updatedAt"
      `, {
        replacements: student,
        type: Sequelize.QueryTypes.INSERT
      });
    }

    // Faculty profiles
    const faculty = [
      {
        id: '880e8400-e29b-41d4-a716-446655440001',
        userId: '660e8400-e29b-41d4-a716-446655440007',
        employeeNumber: 'BM00001',
        departmentId: deptBM,
        title: 'professor',
        officeLocation: 'B Blok 301',
        officeHours: 'Pazartesi 14:00-16:00, Çarşamba 10:00-12:00',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '880e8400-e29b-41d4-a716-446655440002',
        userId: '660e8400-e29b-41d4-a716-446655440008',
        employeeNumber: 'EE00001',
        departmentId: deptEE,
        title: 'associate_professor',
        officeLocation: 'C Blok 205',
        officeHours: 'Salı 13:00-15:00, Perşembe 14:00-16:00',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert faculty
    for (const fac of faculty) {
      await queryInterface.sequelize.query(`
        INSERT INTO faculty (id, "userId", "employeeNumber", "departmentId", title, "officeLocation", "officeHours", "createdAt", "updatedAt")
        VALUES (:id, :userId, :employeeNumber, :departmentId, :title, :officeLocation, :officeHours, :createdAt, :updatedAt)
        ON CONFLICT (id) DO UPDATE SET
          "employeeNumber" = EXCLUDED."employeeNumber",
          "departmentId" = EXCLUDED."departmentId",
          title = EXCLUDED.title,
          "officeLocation" = EXCLUDED."officeLocation",
          "officeHours" = EXCLUDED."officeHours",
          "updatedAt" = EXCLUDED."updatedAt"
      `, {
        replacements: fac,
        type: Sequelize.QueryTypes.INSERT
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Delete in reverse order (faculty -> students -> users)
    await queryInterface.bulkDelete('faculty', {
      employeeNumber: ['BM00001', 'EE00001']
    }, {});

    await queryInterface.bulkDelete('students', {
      studentNumber: ['BM240001', 'BM240002', 'EE240001', 'EE240002', 'ME240001']
    }, {});

    await queryInterface.bulkDelete('users', {
      email: [
        'admin@kampüs.edu.tr',
        'student1@kampüs.edu.tr',
        'student2@kampüs.edu.tr',
        'student3@kampüs.edu.tr',
        'student4@kampüs.edu.tr',
        'student5@kampüs.edu.tr',
        'faculty1@kampüs.edu.tr',
        'faculty2@kampüs.edu.tr'
      ]
    }, {});
  }
};





