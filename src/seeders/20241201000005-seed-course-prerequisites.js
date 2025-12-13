'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Course IDs (from courses seeder)
    const BM101 = 'aa0e8400-e29b-41d4-a716-446655440001'; // Programlamaya Giriş
    const BM102 = 'aa0e8400-e29b-41d4-a716-446655440002'; // Veri Yapıları
    const BM201 = 'aa0e8400-e29b-41d4-a716-446655440003'; // OOP
    const BM301 = 'aa0e8400-e29b-41d4-a716-446655440004'; // Veritabanı
    const BM401 = 'aa0e8400-e29b-41d4-a716-446655440005'; // Web Programlama
    const EE101 = 'aa0e8400-e29b-41d4-a716-446655440006'; // Elektrik Devre Analizi
    const EE201 = 'aa0e8400-e29b-41d4-a716-446655440007'; // Elektronik Devreler
    const ME101 = 'aa0e8400-e29b-41d4-a716-446655440009'; // Statik
    const ME201 = 'aa0e8400-e29b-41d4-a716-446655440010'; // Dinamik

    const prerequisites = [
      // BM102 için BM101 önkoşul
      {
        id: 'bb0e8400-e29b-41d4-a716-446655440001',
        courseId: BM102,
        prerequisiteCourseId: BM101,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // BM201 için BM102 önkoşul
      {
        id: 'bb0e8400-e29b-41d4-a716-446655440002',
        courseId: BM201,
        prerequisiteCourseId: BM102,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // BM301 için BM201 önkoşul
      {
        id: 'bb0e8400-e29b-41d4-a716-446655440003',
        courseId: BM301,
        prerequisiteCourseId: BM201,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // BM401 için BM301 önkoşul
      {
        id: 'bb0e8400-e29b-41d4-a716-446655440004',
        courseId: BM401,
        prerequisiteCourseId: BM301,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // EE201 için EE101 önkoşul
      {
        id: 'bb0e8400-e29b-41d4-a716-446655440005',
        courseId: EE201,
        prerequisiteCourseId: EE101,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // ME201 için ME101 önkoşul
      {
        id: 'bb0e8400-e29b-41d4-a716-446655440006',
        courseId: ME201,
        prerequisiteCourseId: ME101,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const prereq of prerequisites) {
      await queryInterface.sequelize.query(`
        INSERT INTO course_prerequisites (id, "courseId", "prerequisiteCourseId", "createdAt", "updatedAt")
        VALUES (:id, :courseId, :prerequisiteCourseId, :createdAt, :updatedAt)
        ON CONFLICT (id) DO UPDATE SET
          "courseId" = EXCLUDED."courseId",
          "prerequisiteCourseId" = EXCLUDED."prerequisiteCourseId",
          "updatedAt" = EXCLUDED."updatedAt"
      `, {
        replacements: prereq,
        type: Sequelize.QueryTypes.INSERT
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('course_prerequisites', null, {});
  }
};

