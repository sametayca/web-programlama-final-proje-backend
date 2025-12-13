'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // İstanbul Teknik Üniversitesi örnek koordinatları
    const classrooms = [
      {
        id: '990e8400-e29b-41d4-a716-446655440001',
        building: 'A Blok',
        roomNumber: '101',
        capacity: 50,
        latitude: 41.1045,
        longitude: 29.0203,
        featuresJson: {
          projector: true,
          whiteboard: true,
          computer: false,
          airConditioning: true
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '990e8400-e29b-41d4-a716-446655440002',
        building: 'A Blok',
        roomNumber: '102',
        capacity: 40,
        latitude: 41.1046,
        longitude: 29.0204,
        featuresJson: {
          projector: true,
          whiteboard: true,
          computer: true,
          airConditioning: true
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '990e8400-e29b-41d4-a716-446655440003',
        building: 'A Blok',
        roomNumber: '201',
        capacity: 60,
        latitude: 41.1047,
        longitude: 29.0205,
        featuresJson: {
          projector: true,
          whiteboard: true,
          computer: false,
          airConditioning: true
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '990e8400-e29b-41d4-a716-446655440004',
        building: 'B Blok',
        roomNumber: '301',
        capacity: 80,
        latitude: 41.1050,
        longitude: 29.0208,
        featuresJson: {
          projector: true,
          whiteboard: true,
          computer: true,
          airConditioning: true,
          soundSystem: true
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '990e8400-e29b-41d4-a716-446655440005',
        building: 'B Blok',
        roomNumber: '302',
        capacity: 45,
        latitude: 41.1051,
        longitude: 29.0209,
        featuresJson: {
          projector: true,
          whiteboard: true,
          computer: false,
          airConditioning: true
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '990e8400-e29b-41d4-a716-446655440006',
        building: 'C Blok',
        roomNumber: '101',
        capacity: 30,
        latitude: 41.1055,
        longitude: 29.0212,
        featuresJson: {
          projector: false,
          whiteboard: true,
          computer: false,
          airConditioning: true
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '990e8400-e29b-41d4-a716-446655440007',
        building: 'C Blok',
        roomNumber: '201',
        capacity: 35,
        latitude: 41.1056,
        longitude: 29.0213,
        featuresJson: {
          projector: true,
          whiteboard: true,
          computer: false,
          airConditioning: true
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '990e8400-e29b-41d4-a716-446655440008',
        building: 'D Blok',
        roomNumber: '401',
        capacity: 100,
        latitude: 41.1060,
        longitude: 29.0216,
        featuresJson: {
          projector: true,
          whiteboard: true,
          computer: true,
          airConditioning: true,
          soundSystem: true,
          microphone: true
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const classroom of classrooms) {
      await queryInterface.sequelize.query(`
        INSERT INTO classrooms (id, building, "roomNumber", capacity, latitude, longitude, "featuresJson", "isActive", "createdAt", "updatedAt")
        VALUES (:id, :building, :roomNumber, :capacity, :latitude, :longitude, :featuresJson, :isActive, :createdAt, :updatedAt)
        ON CONFLICT (id) DO UPDATE SET
          building = EXCLUDED.building,
          "roomNumber" = EXCLUDED."roomNumber",
          capacity = EXCLUDED.capacity,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          "featuresJson" = EXCLUDED."featuresJson",
          "isActive" = EXCLUDED."isActive",
          "updatedAt" = EXCLUDED."updatedAt"
      `, {
        replacements: {
          ...classroom,
          featuresJson: JSON.stringify(classroom.featuresJson)
        },
        type: Sequelize.QueryTypes.INSERT
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('classrooms', null, {});
  }
};

