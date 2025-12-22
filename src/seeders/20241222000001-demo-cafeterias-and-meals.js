'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create cafeterias
    const cafeteriaIds = {
      main: uuidv4(),
      engineering: uuidv4()
    };

    await queryInterface.bulkInsert('cafeterias', [
      {
        id: cafeteriaIds.main,
        name: 'Ana Kafeterya',
        location: 'Merkez Kampüs - A Blok',
        capacity: 500,
        openingTime: '07:00:00',
        closingTime: '20:00:00',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: cafeteriaIds.engineering,
        name: 'Mühendislik Kafeteryası',
        location: 'Mühendislik Fakültesi - B Blok',
        capacity: 300,
        openingTime: '08:00:00',
        closingTime: '18:00:00',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Create meal menus for next 7 days
    const menus = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const menuDate = new Date(today);
      menuDate.setDate(today.getDate() + i);
      const dateStr = menuDate.toISOString().split('T')[0];

      // Breakfast - Ana Kafeterya
      menus.push({
        id: uuidv4(),
        cafeteriaId: cafeteriaIds.main,
        mealType: 'breakfast',
        menuDate: dateStr,
        mainCourse: 'Menemen',
        sideDish: 'Ekmek, Peynir, Zeytin',
        soup: null,
        salad: null,
        dessert: 'Reçel',
        price: 25.00,
        availableQuota: 100,
        reservedCount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Lunch - Ana Kafeterya
      menus.push({
        id: uuidv4(),
        cafeteriaId: cafeteriaIds.main,
        mealType: 'lunch',
        menuDate: dateStr,
        mainCourse: i % 2 === 0 ? 'Tavuk Şinitzel' : 'Köfte',
        sideDish: i % 2 === 0 ? 'Pilav' : 'Patates Kızartması',
        soup: 'Mercimek Çorbası',
        salad: 'Mevsim Salata',
        dessert: i % 3 === 0 ? 'Sütlaç' : 'Meyve',
        price: 40.00,
        availableQuota: 200,
        reservedCount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Dinner - Ana Kafeterya
      menus.push({
        id: uuidv4(),
        cafeteriaId: cafeteriaIds.main,
        mealType: 'dinner',
        menuDate: dateStr,
        mainCourse: i % 2 === 0 ? 'Makarna' : 'Tavuk Sote',
        sideDish: 'Yoğurt',
        soup: 'Tarhana Çorbası',
        salad: 'Yeşillik',
        dessert: 'Komposto',
        price: 35.00,
        availableQuota: 150,
        reservedCount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Lunch - Mühendislik Kafeteryası
      menus.push({
        id: uuidv4(),
        cafeteriaId: cafeteriaIds.engineering,
        mealType: 'lunch',
        menuDate: dateStr,
        mainCourse: i % 2 === 0 ? 'Izgara Tavuk' : 'Sebze Güveç',
        sideDish: 'Bulgur Pilavı',
        soup: 'Ezogelin Çorbası',
        salad: 'Çoban Salata',
        dessert: 'Meyve',
        price: 38.00,
        availableQuota: 100,
        reservedCount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await queryInterface.bulkInsert('meal_menus', menus);

    console.log(`✅ Seeded ${menus.length} meal menus for 7 days`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('meal_menus', null, {});
    await queryInterface.bulkDelete('cafeterias', null, {});
  }
};

