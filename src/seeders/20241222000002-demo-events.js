'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get a faculty user to be the organizer
    const users = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE role = 'faculty' LIMIT 1;`
    );

    const organizerId = users[0].length > 0 ? users[0][0].id : null;

    const today = new Date();
    const events = [];

    // Event 1: Upcoming workshop (next week)
    const workshop = new Date(today);
    workshop.setDate(today.getDate() + 7);
    events.push({
      id: uuidv4(),
      title: 'Yapay Zeka ve Makine Öğrenmesi Workshop',
      description: 'Python kullanarak temel makine öğrenmesi algoritmalarını öğrenin. TensorFlow ve scikit-learn kütüphaneleri ile hands-on deneyim.',
      eventType: 'workshop',
      startDate: new Date(workshop.setHours(14, 0, 0, 0)),
      endDate: new Date(workshop.setHours(17, 0, 0, 0)),
      location: 'Bilgisayar Mühendisliği Lab - B304',
      capacity: 30,
      registeredCount: 0,
      organizer: 'Prof. Dr. Ayşe Yılmaz',
      organizerId: organizerId,
      imageUrl: 'https://example.com/ai-workshop.jpg',
      isActive: true,
      requiresApproval: false,
      priority: 'normal',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Event 2: Seminar (2 weeks)
    const seminar = new Date(today);
    seminar.setDate(today.getDate() + 14);
    events.push({
      id: uuidv4(),
      title: 'Blockchain Teknolojisi ve Kripto Paralar',
      description: 'Blockchain\'in temel prensipleri, kripto para sistemleri ve akıllı kontratlar hakkında bilgi edinme semineri.',
      eventType: 'seminar',
      startDate: new Date(seminar.setHours(10, 0, 0, 0)),
      endDate: new Date(seminar.setHours(12, 0, 0, 0)),
      location: 'Konferans Salonu - A Blok',
      capacity: 100,
      registeredCount: 0,
      organizer: 'Dr. Mehmet Kaya',
      organizerId: organizerId,
      imageUrl: 'https://example.com/blockchain-seminar.jpg',
      isActive: true,
      requiresApproval: false,
      priority: 'normal',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Event 3: Social event (next month)
    const social = new Date(today);
    social.setDate(today.getDate() + 30);
    events.push({
      id: uuidv4(),
      title: 'Bahar Şenliği 2024',
      description: 'Kampüsümüzün geleneksel bahar şenliği! Müzik, yemek, oyunlar ve daha fazlası.',
      eventType: 'social',
      startDate: new Date(social.setHours(12, 0, 0, 0)),
      endDate: new Date(social.setHours(20, 0, 0, 0)),
      location: 'Merkez Kampüs Bahçesi',
      capacity: 500,
      registeredCount: 0,
      organizer: 'Öğrenci Konseyi',
      organizerId: organizerId,
      imageUrl: 'https://example.com/spring-festival.jpg',
      isActive: true,
      requiresApproval: false,
      priority: 'normal',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Event 4: Conference (3 weeks)
    const conference = new Date(today);
    conference.setDate(today.getDate() + 21);
    events.push({
      id: uuidv4(),
      title: 'Ulusal Yazılım Mühendisliği Konferansı',
      description: '3 günlük ulusal yazılım mühendisliği konferansı. Sektör liderleri ve akademisyenlerle networking fırsatı.',
      eventType: 'conference',
      startDate: new Date(new Date(conference).setHours(9, 0, 0, 0)),
      endDate: new Date(new Date(new Date(conference).setDate(conference.getDate() + 2)).setHours(18, 0, 0, 0)),
      location: 'Kongre Merkezi',
      capacity: 200,
      registeredCount: 0,
      organizer: 'Mühendislik Fakültesi',
      organizerId: organizerId,
      imageUrl: 'https://example.com/software-conference.jpg',
      isActive: true,
      requiresApproval: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Event 5: Sports event (10 days)
    const sports = new Date(today);
    sports.setDate(today.getDate() + 10);
    events.push({
      id: uuidv4(),
      title: 'Kampüsler Arası Basketbol Turnuvası',
      description: 'Üniversiteler arası basketbol turnuvası. Takımınızı desteklemeye gelin!',
      eventType: 'sports',
      startDate: new Date(sports.setHours(15, 0, 0, 0)),
      endDate: new Date(sports.setHours(19, 0, 0, 0)),
      location: 'Spor Kompleksi - Kapalı Salon',
      capacity: 300,
      registeredCount: 0,
      organizer: 'Spor Kulübü',
      organizerId: organizerId,
      imageUrl: 'https://example.com/basketball-tournament.jpg',
      isActive: true,
      requiresApproval: false,
      priority: 'normal',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await queryInterface.bulkInsert('events', events);

    console.log(`✅ Seeded ${events.length} demo events`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('events', null, {});
  }
};

