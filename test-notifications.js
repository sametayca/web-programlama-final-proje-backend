/**
 * Bildirim Sistemi Test Scripti
 * 
 * Bu script ile yemek rezervasyonu, not girme ve etkinlik ekleme bildirimlerini test edebilirsiniz.
 * 
 * Kullanım:
 * node test-notifications.js <test-type> <userId>
 * 
 * Test Types:
 * - meal: Yemek rezervasyonu bildirimi testi
 * - grade: Not girme bildirimi testi
 * - event: Etkinlik ekleme bildirimi testi
 * - all: Tüm bildirimleri test et
 * 
 * Örnek:
 * node test-notifications.js meal 660e8400-e29b-41d4-a716-446655440007
 * node test-notifications.js all 660e8400-e29b-41d4-a716-446655440007
 */

require('dotenv').config();
const notificationService = require('./src/services/notificationService');
const { User, Student, MealMenu, MealReservation, Enrollment, CourseSection, Course } = require('./src/models');

const testType = process.argv[2] || 'all';
const userId = process.argv[3];

if (!userId) {
  console.error('❌ Hata: userId parametresi gerekli!');
  console.log('\nKullanım: node test-notifications.js <test-type> <userId>');
  console.log('\nTest Types: meal, grade, event, all');
  process.exit(1);
}

async function testMealReservationNotification() {
  console.log('\n🍽️  Yemek Rezervasyonu Bildirimi Testi...');
  
  try {
    // Öğrenci bilgilerini al
    const student = await Student.findOne({ where: { userId } });
    if (!student) {
      console.error('❌ Öğrenci bulunamadı!');
      return false;
    }

    // Aktif bir menü bul
    const menu = await MealMenu.findOne({ 
      where: { isActive: true },
      order: [['menuDate', 'ASC']]
    });

    if (!menu) {
      console.error('❌ Aktif menü bulunamadı!');
      return false;
    }

    // Test rezervasyonu oluştur
    const testReservation = {
      id: 'test-' + Date.now(),
      qrCode: 'TEST-QR-' + Math.random().toString(36).substr(2, 9),
      reservationDate: menu.menuDate,
      date: menu.menuDate,
      status: 'pending'
    };

    const user = await User.findByPk(userId);
    if (!user) {
      console.error('❌ Kullanıcı bulunamadı!');
      return false;
    }

    // Bildirim gönder
    await notificationService.sendMealReservationConfirmation(
      testReservation,
      user.email,
      `${user.firstName} ${user.lastName}`,
      userId
    );

    console.log('✅ Yemek rezervasyonu bildirimi başarıyla gönderildi!');
    console.log(`   - Kullanıcı: ${user.firstName} ${user.lastName}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - QR Kod: ${testReservation.qrCode}`);
    return true;
  } catch (error) {
    console.error('❌ Yemek rezervasyonu bildirimi hatası:', error.message);
    console.error(error.stack);
    return false;
  }
}

async function testGradeNotification() {
  console.log('\n📝 Not Girme Bildirimi Testi...');
  
  try {
    // Öğrencinin bir ders kaydını bul
    const enrollment = await Enrollment.findOne({
      where: { studentId: userId },
      include: [
        {
          model: CourseSection,
          as: 'section',
          include: [
            {
              model: Course,
              as: 'course',
              attributes: ['code', 'name']
            }
          ]
        }
      ]
    });

    if (!enrollment) {
      console.error('❌ Öğrencinin ders kaydı bulunamadı!');
      return false;
    }

    const courseName = enrollment.section?.course?.name || 'Test Dersi';
    const courseCode = enrollment.section?.course?.code || 'TEST101';

    // Test bildirimi gönder
    await notificationService.createNotification({
      userId: userId,
      title: `📝 ${courseCode} - Not Girişi Yapıldı`,
      message: `${courseName} dersi için Vize notunuz: 85`,
      category: 'academic',
      type: 'info',
      link: '/grades'
    });

    console.log('✅ Not girme bildirimi başarıyla gönderildi!');
    console.log(`   - Ders: ${courseCode} - ${courseName}`);
    console.log(`   - Not: Vize 85`);
    return true;
  } catch (error) {
    console.error('❌ Not girme bildirimi hatası:', error.message);
    console.error(error.stack);
    return false;
  }
}

async function testEventNotification() {
  console.log('\n🎉 Etkinlik Ekleme Bildirimi Testi...');
  
  try {
    const testEvent = {
      id: 'test-event-' + Date.now(),
      title: 'Test Etkinliği - Bildirim Testi',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 gün sonra
      location: 'Kampüs Merkez Salonu'
    };

    const eventDate = new Date(testEvent.startDate).toLocaleDateString('tr-TR');

    // Öğrencilere bildirim gönder
    await notificationService.broadcastNotification({
      title: `🎉 Yeni Etkinlik: ${testEvent.title}`,
      message: `${testEvent.title} - ${eventDate} tarihinde ${testEvent.location} konumunda. Kaydolmak için tıklayın!`,
      category: 'event',
      type: 'info',
      link: `/events/${testEvent.id}`
    }, 'student');

    console.log('✅ Etkinlik ekleme bildirimi başarıyla gönderildi!');
    console.log(`   - Etkinlik: ${testEvent.title}`);
    console.log(`   - Tarih: ${eventDate}`);
    console.log(`   - Konum: ${testEvent.location}`);
    console.log(`   - Hedef: Tüm öğrenciler`);
    return true;
  } catch (error) {
    console.error('❌ Etkinlik ekleme bildirimi hatası:', error.message);
    console.error(error.stack);
    return false;
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('   BİLDİRİM SİSTEMİ TEST SCRIPTİ');
  console.log('═══════════════════════════════════════════════════');
  console.log(`\nTest Tipi: ${testType}`);
  console.log(`Kullanıcı ID: ${userId}\n`);

  const results = {
    meal: false,
    grade: false,
    event: false
  };

  if (testType === 'meal' || testType === 'all') {
    results.meal = await testMealReservationNotification();
  }

  if (testType === 'grade' || testType === 'all') {
    results.grade = await testGradeNotification();
  }

  if (testType === 'event' || testType === 'all') {
    results.event = await testEventNotification();
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('   TEST SONUÇLARI');
  console.log('═══════════════════════════════════════════════════');
  console.log(`🍽️  Yemek Rezervasyonu: ${results.meal ? '✅ BAŞARILI' : '❌ BAŞARISIZ'}`);
  console.log(`📝 Not Girme: ${results.grade ? '✅ BAŞARILI' : '❌ BAŞARISIZ'}`);
  console.log(`🎉 Etkinlik Ekleme: ${results.event ? '✅ BAŞARILI' : '❌ BAŞARISIZ'}`);
  console.log('═══════════════════════════════════════════════════\n');

  // Veritabanı bağlantısını kapat
  process.exit(0);
}

// Script'i çalıştır
runTests().catch(error => {
  console.error('❌ Kritik Hata:', error);
  process.exit(1);
});

