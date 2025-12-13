'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Course IDs
    const BM101 = 'aa0e8400-e29b-41d4-a716-446655440001';
    const BM102 = 'aa0e8400-e29b-41d4-a716-446655440002';
    const BM201 = 'aa0e8400-e29b-41d4-a716-446655440003';
    const BM301 = 'aa0e8400-e29b-41d4-a716-446655440004';
    const BM401 = 'aa0e8400-e29b-41d4-a716-446655440005';
    const EE101 = 'aa0e8400-e29b-41d4-a716-446655440006';
    const EE201 = 'aa0e8400-e29b-41d4-a716-446655440007';

    // Instructor IDs (from users seeder)
    const faculty1 = '660e8400-e29b-41d4-a716-446655440007'; // Prof. Dr. Ali Veli
    const faculty2 = '660e8400-e29b-41d4-a716-446655440008'; // Doç. Dr. Fatma Nur

    // Classroom IDs
    const classroom1 = '990e8400-e29b-41d4-a716-446655440001'; // A Blok 101
    const classroom2 = '990e8400-e29b-41d4-a716-446655440002'; // A Blok 102
    const classroom3 = '990e8400-e29b-41d4-a716-446655440003'; // A Blok 201
    const classroom4 = '990e8400-e29b-41d4-a716-446655440004'; // B Blok 301

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const semester = currentMonth >= 0 && currentMonth < 6 ? 'spring' : 'fall';

    const sections = [
      // BM101 - Programlamaya Giriş
      {
        id: 'cc0e8400-e29b-41d4-a716-446655440001',
        courseId: BM101,
        sectionNumber: 1,
        semester: semester,
        year: currentYear,
        instructorId: faculty1,
        classroomId: classroom1,
        capacity: 50,
        enrolledCount: 0,
        scheduleJson: {
          days: ['monday', 'wednesday'],
          startTime: '09:00',
          endTime: '10:30'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'cc0e8400-e29b-41d4-a716-446655440002',
        courseId: BM101,
        sectionNumber: 2,
        semester: semester,
        year: currentYear,
        instructorId: faculty1,
        classroomId: classroom2,
        capacity: 40,
        enrolledCount: 0,
        scheduleJson: {
          days: ['tuesday', 'thursday'],
          startTime: '14:00',
          endTime: '15:30'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // BM102 - Veri Yapıları
      {
        id: 'cc0e8400-e29b-41d4-a716-446655440003',
        courseId: BM102,
        sectionNumber: 1,
        semester: semester,
        year: currentYear,
        instructorId: faculty1,
        classroomId: classroom3,
        capacity: 60,
        enrolledCount: 0,
        scheduleJson: {
          days: ['monday', 'wednesday', 'friday'],
          startTime: '10:30',
          endTime: '12:00'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // BM201 - OOP
      {
        id: 'cc0e8400-e29b-41d4-a716-446655440004',
        courseId: BM201,
        sectionNumber: 1,
        semester: semester,
        year: currentYear,
        instructorId: faculty2,
        classroomId: classroom4,
        capacity: 80,
        enrolledCount: 0,
        scheduleJson: {
          days: ['tuesday', 'thursday'],
          startTime: '09:00',
          endTime: '10:30'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // BM301 - Veritabanı
      {
        id: 'cc0e8400-e29b-41d4-a716-446655440005',
        courseId: BM301,
        sectionNumber: 1,
        semester: semester,
        year: currentYear,
        instructorId: faculty2,
        classroomId: classroom1,
        capacity: 50,
        enrolledCount: 0,
        scheduleJson: {
          days: ['monday', 'wednesday'],
          startTime: '13:00',
          endTime: '14:30'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // BM401 - Web Programlama
      {
        id: 'cc0e8400-e29b-41d4-a716-446655440006',
        courseId: BM401,
        sectionNumber: 1,
        semester: semester,
        year: currentYear,
        instructorId: faculty1,
        classroomId: classroom2,
        capacity: 40,
        enrolledCount: 0,
        scheduleJson: {
          days: ['tuesday', 'thursday'],
          startTime: '10:30',
          endTime: '12:00'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // EE101 - Elektrik Devre Analizi
      {
        id: 'cc0e8400-e29b-41d4-a716-446655440007',
        courseId: EE101,
        sectionNumber: 1,
        semester: semester,
        year: currentYear,
        instructorId: faculty2,
        classroomId: classroom3,
        capacity: 60,
        enrolledCount: 0,
        scheduleJson: {
          days: ['monday', 'wednesday', 'friday'],
          startTime: '08:00',
          endTime: '09:30'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // EE201 - Elektronik Devreler
      {
        id: 'cc0e8400-e29b-41d4-a716-446655440008',
        courseId: EE201,
        sectionNumber: 1,
        semester: semester,
        year: currentYear,
        instructorId: faculty2,
        classroomId: classroom4,
        capacity: 80,
        enrolledCount: 0,
        scheduleJson: {
          days: ['tuesday', 'thursday'],
          startTime: '13:00',
          endTime: '14:30'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // SE101 - Yazılım Mühendisliğine Giriş
      {
        id: 'cc0e8400-e29b-41d4-a716-446655440009',
        courseId: 'aa0e8400-e29b-41d4-a716-446655440011',
        sectionNumber: 1,
        semester: semester,
        year: currentYear,
        instructorId: faculty1,
        classroomId: classroom1,
        capacity: 50,
        enrolledCount: 0,
        scheduleJson: {
          days: ['monday', 'wednesday'],
          startTime: '11:00',
          endTime: '12:30'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // IE101 - Endüstri Mühendisliğine Giriş
      {
        id: 'cc0e8400-e29b-41d4-a716-446655440010',
        courseId: 'aa0e8400-e29b-41d4-a716-446655440013',
        sectionNumber: 1,
        semester: semester,
        year: currentYear,
        instructorId: faculty2,
        classroomId: classroom2,
        capacity: 40,
        enrolledCount: 0,
        scheduleJson: {
          days: ['tuesday', 'thursday'],
          startTime: '15:30',
          endTime: '17:00'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // CE101 - İnşaat Mühendisliğine Giriş
      {
        id: 'cc0e8400-e29b-41d4-a716-446655440011',
        courseId: 'aa0e8400-e29b-41d4-a716-446655440016',
        sectionNumber: 1,
        semester: semester,
        year: currentYear,
        instructorId: faculty1,
        classroomId: classroom3,
        capacity: 60,
        enrolledCount: 0,
        scheduleJson: {
          days: ['monday', 'wednesday', 'friday'],
          startTime: '13:00',
          endTime: '14:30'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // BME101 - Biyomedikal Mühendisliğine Giriş
      {
        id: 'cc0e8400-e29b-41d4-a716-446655440012',
        courseId: 'aa0e8400-e29b-41d4-a716-446655440019',
        sectionNumber: 1,
        semester: semester,
        year: currentYear,
        instructorId: faculty2,
        classroomId: classroom4,
        capacity: 80,
        enrolledCount: 0,
        scheduleJson: {
          days: ['tuesday', 'thursday'],
          startTime: '08:00',
          endTime: '09:30'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // CHE101 - Kimya Mühendisliğine Giriş
      {
        id: 'cc0e8400-e29b-41d4-a716-446655440013',
        courseId: 'aa0e8400-e29b-41d4-a716-446655440022',
        sectionNumber: 1,
        semester: semester,
        year: currentYear,
        instructorId: faculty1,
        classroomId: classroom1,
        capacity: 50,
        enrolledCount: 0,
        scheduleJson: {
          days: ['monday', 'wednesday'],
          startTime: '14:30',
          endTime: '16:00'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // BUS101 - İşletmeye Giriş
      {
        id: 'cc0e8400-e29b-41d4-a716-446655440014',
        courseId: 'aa0e8400-e29b-41d4-a716-446655440025',
        sectionNumber: 1,
        semester: semester,
        year: currentYear,
        instructorId: faculty2,
        classroomId: classroom2,
        capacity: 40,
        enrolledCount: 0,
        scheduleJson: {
          days: ['tuesday', 'thursday'],
          startTime: '09:00',
          endTime: '10:30'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // ECO101 - İktisada Giriş
      {
        id: 'cc0e8400-e29b-41d4-a716-446655440015',
        courseId: 'aa0e8400-e29b-41d4-a716-446655440028',
        sectionNumber: 1,
        semester: semester,
        year: currentYear,
        instructorId: faculty1,
        classroomId: classroom3,
        capacity: 60,
        enrolledCount: 0,
        scheduleJson: {
          days: ['monday', 'wednesday', 'friday'],
          startTime: '15:00',
          endTime: '16:30'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // PSY101 - Psikolojiye Giriş
      {
        id: 'cc0e8400-e29b-41d4-a716-446655440016',
        courseId: 'aa0e8400-e29b-41d4-a716-446655440031',
        sectionNumber: 1,
        semester: semester,
        year: currentYear,
        instructorId: faculty2,
        classroomId: classroom4,
        capacity: 80,
        enrolledCount: 0,
        scheduleJson: {
          days: ['tuesday', 'thursday'],
          startTime: '10:30',
          endTime: '12:00'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // LAW101 - Hukuka Giriş
      {
        id: 'cc0e8400-e29b-41d4-a716-446655440017',
        courseId: 'aa0e8400-e29b-41d4-a716-446655440034',
        sectionNumber: 1,
        semester: semester,
        year: currentYear,
        instructorId: faculty1,
        classroomId: classroom1,
        capacity: 50,
        enrolledCount: 0,
        scheduleJson: {
          days: ['monday', 'wednesday'],
          startTime: '16:00',
          endTime: '17:30'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // MED101 - Tıbba Giriş
      {
        id: 'cc0e8400-e29b-41d4-a716-446655440018',
        courseId: 'aa0e8400-e29b-41d4-a716-446655440037',
        sectionNumber: 1,
        semester: semester,
        year: currentYear,
        instructorId: faculty2,
        classroomId: classroom2,
        capacity: 40,
        enrolledCount: 0,
        scheduleJson: {
          days: ['tuesday', 'thursday'],
          startTime: '13:00',
          endTime: '14:30'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // EDU101 - Eğitim Bilimlerine Giriş
      {
        id: 'cc0e8400-e29b-41d4-a716-446655440019',
        courseId: 'aa0e8400-e29b-41d4-a716-446655440040',
        sectionNumber: 1,
        semester: semester,
        year: currentYear,
        instructorId: faculty1,
        classroomId: classroom3,
        capacity: 60,
        enrolledCount: 0,
        scheduleJson: {
          days: ['monday', 'wednesday', 'friday'],
          startTime: '09:30',
          endTime: '11:00'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // ARCH101 - Mimarlığa Giriş
      {
        id: 'cc0e8400-e29b-41d4-a716-446655440020',
        courseId: 'aa0e8400-e29b-41d4-a716-446655440043',
        sectionNumber: 1,
        semester: semester,
        year: currentYear,
        instructorId: faculty2,
        classroomId: classroom4,
        capacity: 80,
        enrolledCount: 0,
        scheduleJson: {
          days: ['tuesday', 'thursday'],
          startTime: '14:30',
          endTime: '16:00'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const section of sections) {
      await queryInterface.sequelize.query(`
        INSERT INTO course_sections (id, "courseId", "sectionNumber", semester, year, "instructorId", "classroomId", capacity, "enrolledCount", "scheduleJson", "isActive", "createdAt", "updatedAt")
        VALUES (:id, :courseId, :sectionNumber, :semester, :year, :instructorId, :classroomId, :capacity, :enrolledCount, :scheduleJson, :isActive, :createdAt, :updatedAt)
        ON CONFLICT (id) DO UPDATE SET
          "courseId" = EXCLUDED."courseId",
          "sectionNumber" = EXCLUDED."sectionNumber",
          semester = EXCLUDED.semester,
          year = EXCLUDED.year,
          "instructorId" = EXCLUDED."instructorId",
          "classroomId" = EXCLUDED."classroomId",
          capacity = EXCLUDED.capacity,
          "enrolledCount" = EXCLUDED."enrolledCount",
          "scheduleJson" = EXCLUDED."scheduleJson",
          "isActive" = EXCLUDED."isActive",
          "updatedAt" = EXCLUDED."updatedAt"
      `, {
        replacements: {
          ...section,
          scheduleJson: JSON.stringify(section.scheduleJson)
        },
        type: Sequelize.QueryTypes.INSERT
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('course_sections', null, {});
  }
};

