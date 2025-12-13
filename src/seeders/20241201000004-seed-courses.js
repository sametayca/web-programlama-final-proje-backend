'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Department IDs - Tüm 15 bölüm
    const deptBM = '550e8400-e29b-41d4-a716-446655440001'; // Bilgisayar Mühendisliği
    const deptEE = '550e8400-e29b-41d4-a716-446655440002'; // Elektrik-Elektronik
    const deptME = '550e8400-e29b-41d4-a716-446655440003'; // Makine Mühendisliği
    const deptIE = '550e8400-e29b-41d4-a716-446655440004'; // Endüstri Mühendisliği
    const deptCE = '550e8400-e29b-41d4-a716-446655440005'; // İnşaat Mühendisliği
    const deptSE = '550e8400-e29b-41d4-a716-446655440006'; // Yazılım Mühendisliği
    const deptBME = '550e8400-e29b-41d4-a716-446655440007'; // Biyomedikal Mühendisliği
    const deptCHE = '550e8400-e29b-41d4-a716-446655440008'; // Kimya Mühendisliği
    const deptBUS = '550e8400-e29b-41d4-a716-446655440009'; // İşletme
    const deptECO = '550e8400-e29b-41d4-a716-446655440010'; // İktisat
    const deptPSY = '550e8400-e29b-41d4-a716-446655440011'; // Psikoloji
    const deptLAW = '550e8400-e29b-41d4-a716-446655440012'; // Hukuk
    const deptMED = '550e8400-e29b-41d4-a716-446655440013'; // Tıp
    const deptEDU = '550e8400-e29b-41d4-a716-446655440014'; // Eğitim Bilimleri
    const deptARCH = '550e8400-e29b-41d4-a716-446655440015'; // Mimarlık

    const courses = [
      // Bilgisayar Mühendisliği
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440001',
        code: 'BM101',
        name: 'Programlamaya Giriş',
        description: 'Temel programlama kavramları, algoritma tasarımı ve problem çözme teknikleri.',
        credits: 4,
        ects: 6,
        departmentId: deptBM,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440002',
        code: 'BM102',
        name: 'Veri Yapıları ve Algoritmalar',
        description: 'Temel veri yapıları, algoritma analizi ve karmaşıklık teorisi.',
        credits: 4,
        ects: 6,
        departmentId: deptBM,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440003',
        code: 'BM201',
        name: 'Nesne Yönelimli Programlama',
        description: 'OOP prensipleri, sınıf tasarımı ve tasarım desenleri.',
        credits: 4,
        ects: 6,
        departmentId: deptBM,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440004',
        code: 'BM301',
        name: 'Veritabanı Sistemleri',
        description: 'İlişkisel veritabanı tasarımı, SQL ve NoSQL veritabanları.',
        credits: 3,
        ects: 5,
        departmentId: deptBM,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440005',
        code: 'BM401',
        name: 'Web Programlama',
        description: 'Modern web geliştirme teknolojileri, frontend ve backend geliştirme.',
        credits: 4,
        ects: 6,
        departmentId: deptBM,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Elektrik-Elektronik Mühendisliği
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440006',
        code: 'EE101',
        name: 'Elektrik Devre Analizi',
        description: 'Temel elektrik devreleri, Kirchhoff yasaları ve devre analiz yöntemleri.',
        credits: 4,
        ects: 6,
        departmentId: deptEE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440007',
        code: 'EE201',
        name: 'Elektronik Devreler',
        description: 'Diyot, transistör ve op-amp devreleri, analog elektronik tasarımı.',
        credits: 4,
        ects: 6,
        departmentId: deptEE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440008',
        code: 'EE301',
        name: 'Sinyal İşleme',
        description: 'Sinyal analizi, Fourier dönüşümü ve dijital sinyal işleme.',
        credits: 3,
        ects: 5,
        departmentId: deptEE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Makine Mühendisliği
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440009',
        code: 'ME101',
        name: 'Statik',
        description: 'Kuvvet, moment, denge ve yapısal analiz.',
        credits: 4,
        ects: 6,
        departmentId: deptME,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440010',
        code: 'ME201',
        name: 'Dinamik',
        description: 'Hareket analizi, Newton yasaları ve enerji yöntemleri.',
        credits: 4,
        ects: 6,
        departmentId: deptME,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Yazılım Mühendisliği
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440011',
        code: 'SE101',
        name: 'Yazılım Mühendisliğine Giriş',
        description: 'Yazılım geliştirme süreçleri, metodolojiler ve proje yönetimi.',
        credits: 3,
        ects: 5,
        departmentId: deptSE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440012',
        code: 'SE201',
        name: 'Yazılım Tasarımı',
        description: 'Yazılım mimarisi, tasarım desenleri ve refactoring teknikleri.',
        credits: 4,
        ects: 6,
        departmentId: deptSE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Endüstri Mühendisliği
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440013',
        code: 'IE101',
        name: 'Endüstri Mühendisliğine Giriş',
        description: 'Endüstri mühendisliği temel kavramları, sistem yaklaşımı ve optimizasyon.',
        credits: 3,
        ects: 5,
        departmentId: deptIE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440014',
        code: 'IE201',
        name: 'Üretim Planlama ve Kontrol',
        description: 'Üretim sistemleri, planlama teknikleri ve stok yönetimi.',
        credits: 4,
        ects: 6,
        departmentId: deptIE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440015',
        code: 'IE301',
        name: 'Yöneylem Araştırması',
        description: 'Doğrusal programlama, ağ modelleri ve karar analizi.',
        credits: 4,
        ects: 6,
        departmentId: deptIE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // İnşaat Mühendisliği
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440016',
        code: 'CE101',
        name: 'İnşaat Mühendisliğine Giriş',
        description: 'İnşaat mühendisliği temel kavramları, yapı malzemeleri ve tasarım prensipleri.',
        credits: 3,
        ects: 5,
        departmentId: deptCE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440017',
        code: 'CE201',
        name: 'Yapı Statiği',
        description: 'Yapı sistemlerinin statik analizi, kuvvet ve moment hesaplamaları.',
        credits: 4,
        ects: 6,
        departmentId: deptCE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440018',
        code: 'CE301',
        name: 'Betonarme Yapılar',
        description: 'Betonarme tasarım prensipleri, kolon, kiriş ve döşeme tasarımı.',
        credits: 4,
        ects: 6,
        departmentId: deptCE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Biyomedikal Mühendisliği
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440019',
        code: 'BME101',
        name: 'Biyomedikal Mühendisliğine Giriş',
        description: 'Biyomedikal mühendisliği temel kavramları, tıbbi cihazlar ve biyomalzemeler.',
        credits: 3,
        ects: 5,
        departmentId: deptBME,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440020',
        code: 'BME201',
        name: 'Biyosinyal İşleme',
        description: 'Tıbbi sinyal analizi, EKG, EEG ve EMG sinyallerinin işlenmesi.',
        credits: 4,
        ects: 6,
        departmentId: deptBME,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440021',
        code: 'BME301',
        name: 'Tıbbi Görüntüleme',
        description: 'X-ray, MRI, CT ve ultrason görüntüleme teknikleri.',
        credits: 4,
        ects: 6,
        departmentId: deptBME,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Kimya Mühendisliği
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440022',
        code: 'CHE101',
        name: 'Kimya Mühendisliğine Giriş',
        description: 'Kimya mühendisliği temel kavramları, kütle ve enerji denklikleri.',
        credits: 3,
        ects: 5,
        departmentId: deptCHE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440023',
        code: 'CHE201',
        name: 'Termodinamik',
        description: 'Termodinamik yasaları, faz dengeleri ve reaksiyon termodinamiği.',
        credits: 4,
        ects: 6,
        departmentId: deptCHE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440024',
        code: 'CHE301',
        name: 'Kimyasal Reaktör Tasarımı',
        description: 'Reaktör tipleri, reaksiyon kinetiği ve reaktör tasarımı.',
        credits: 4,
        ects: 6,
        departmentId: deptCHE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // İşletme
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440025',
        code: 'BUS101',
        name: 'İşletmeye Giriş',
        description: 'İşletme temel kavramları, yönetim fonksiyonları ve organizasyon yapıları.',
        credits: 3,
        ects: 5,
        departmentId: deptBUS,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440026',
        code: 'BUS201',
        name: 'Muhasebe İlkeleri',
        description: 'Temel muhasebe kavramları, mali tablolar ve kayıt tutma.',
        credits: 4,
        ects: 6,
        departmentId: deptBUS,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440027',
        code: 'BUS301',
        name: 'Pazarlama Yönetimi',
        description: 'Pazarlama stratejileri, pazar araştırması ve marka yönetimi.',
        credits: 4,
        ects: 6,
        departmentId: deptBUS,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // İktisat
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440028',
        code: 'ECO101',
        name: 'İktisada Giriş',
        description: 'Temel iktisat kavramları, arz-talep ve piyasa mekanizması.',
        credits: 3,
        ects: 5,
        departmentId: deptECO,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440029',
        code: 'ECO201',
        name: 'Makro İktisat',
        description: 'Milli gelir, enflasyon, işsizlik ve para politikası.',
        credits: 4,
        ects: 6,
        departmentId: deptECO,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440030',
        code: 'ECO301',
        name: 'Ekonometri',
        description: 'İktisadi verilerin istatistiksel analizi ve modelleme.',
        credits: 4,
        ects: 6,
        departmentId: deptECO,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Psikoloji
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440031',
        code: 'PSY101',
        name: 'Psikolojiye Giriş',
        description: 'Psikolojinin temel kavramları, tarihçesi ve araştırma yöntemleri.',
        credits: 3,
        ects: 5,
        departmentId: deptPSY,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440032',
        code: 'PSY201',
        name: 'Gelişim Psikolojisi',
        description: 'İnsan gelişiminin evreleri, bilişsel ve sosyal gelişim.',
        credits: 4,
        ects: 6,
        departmentId: deptPSY,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440033',
        code: 'PSY301',
        name: 'Klinik Psikoloji',
        description: 'Psikolojik bozukluklar, tanı ve tedavi yaklaşımları.',
        credits: 4,
        ects: 6,
        departmentId: deptPSY,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Hukuk
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440034',
        code: 'LAW101',
        name: 'Hukuka Giriş',
        description: 'Hukukun temel kavramları, hukuk sistemleri ve kaynakları.',
        credits: 3,
        ects: 5,
        departmentId: deptLAW,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440035',
        code: 'LAW201',
        name: 'Anayasa Hukuku',
        description: 'Anayasa kavramı, temel haklar ve devlet organları.',
        credits: 4,
        ects: 6,
        departmentId: deptLAW,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440036',
        code: 'LAW301',
        name: 'Medeni Hukuk',
        description: 'Kişiler hukuku, aile hukuku ve miras hukuku.',
        credits: 4,
        ects: 6,
        departmentId: deptLAW,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Tıp
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440037',
        code: 'MED101',
        name: 'Tıbba Giriş',
        description: 'Tıp eğitimine giriş, tıp etiği ve hasta-hekim ilişkisi.',
        credits: 3,
        ects: 5,
        departmentId: deptMED,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440038',
        code: 'MED201',
        name: 'Anatomi',
        description: 'İnsan vücudunun yapısal organizasyonu ve organ sistemleri.',
        credits: 6,
        ects: 8,
        departmentId: deptMED,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440039',
        code: 'MED301',
        name: 'Fizyoloji',
        description: 'İnsan vücudunun normal işleyişi ve organ fonksiyonları.',
        credits: 6,
        ects: 8,
        departmentId: deptMED,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Eğitim Bilimleri
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440040',
        code: 'EDU101',
        name: 'Eğitim Bilimlerine Giriş',
        description: 'Eğitimin temel kavramları, eğitim felsefesi ve tarihçesi.',
        credits: 3,
        ects: 5,
        departmentId: deptEDU,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440041',
        code: 'EDU201',
        name: 'Öğretim Yöntemleri',
        description: 'Öğretim stratejileri, öğrenme teorileri ve ders planlama.',
        credits: 4,
        ects: 6,
        departmentId: deptEDU,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440042',
        code: 'EDU301',
        name: 'Eğitim Psikolojisi',
        description: 'Öğrenme psikolojisi, motivasyon ve bireysel farklılıklar.',
        credits: 4,
        ects: 6,
        departmentId: deptEDU,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Mimarlık
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440043',
        code: 'ARCH101',
        name: 'Mimarlığa Giriş',
        description: 'Mimarlık temel kavramları, tarihçe ve tasarım prensipleri.',
        credits: 3,
        ects: 5,
        departmentId: deptARCH,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440044',
        code: 'ARCH201',
        name: 'Mimari Tasarım',
        description: 'Mimari tasarım süreci, mekân organizasyonu ve form analizi.',
        credits: 6,
        ects: 8,
        departmentId: deptARCH,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440045',
        code: 'ARCH301',
        name: 'Yapı Bilgisi',
        description: 'Yapı sistemleri, malzemeler ve yapı fiziği.',
        credits: 4,
        ects: 6,
        departmentId: deptARCH,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const course of courses) {
      await queryInterface.sequelize.query(`
        INSERT INTO courses (id, code, name, description, credits, ects, "departmentId", "isActive", "createdAt", "updatedAt")
        VALUES (:id, :code, :name, :description, :credits, :ects, :departmentId, :isActive, :createdAt, :updatedAt)
        ON CONFLICT (id) DO UPDATE SET
          code = EXCLUDED.code,
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          credits = EXCLUDED.credits,
          ects = EXCLUDED.ects,
          "departmentId" = EXCLUDED."departmentId",
          "isActive" = EXCLUDED."isActive",
          "updatedAt" = EXCLUDED."updatedAt"
      `, {
        replacements: course,
        type: Sequelize.QueryTypes.INSERT
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('courses', null, {});
  }
};

