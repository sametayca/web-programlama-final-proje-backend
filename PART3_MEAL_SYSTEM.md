# Part 3 - Meal Reservation System

## 📋 Genel Bakış

Öğrencilerin kampüs kafeteryalarından yemek rezervasyonu yapabilmesi, QR kod ile yemek alabilmesi ve dijital cüzdan sistemi.

## 🎯 Özellikler

### ✅ İş Kuralları

1. **Burslu Öğrenciler**
   - Günde maksimum 2 öğün rezervasyon yapabilir
   - Yemekler ücretsizdir
   - İstatistikler `isScholarshipMeal: true` ile tutulur

2. **Ücretli Öğrenciler**
   - Rezervasyon yaparken wallet bakiyesi kontrol edilir
   - **Para, yemek KULLANILDIĞINDA düşer** (rezervasyonda değil)
   - Her işlem `transactions` tablosunda loglanır

3. **QR Kod Sistemi**
   - Her rezervasyon UUID ile benzersiz QR kod alır
   - QR kod yemek kullanımında doğrulanır
   - Sadece o günün yemekleri kullanılabilir

4. **ACID Transaction**
   - Tüm finansal işlemler transaction içinde yapılır
   - Row-level locking ile eşzamanlılık kontrolü
   - Rollback mekanizması

## 🗄️ Database Yapısı

### Tablolar

#### 1. `cafeterias`
```sql
- id (UUID, PK)
- name (STRING)
- location (STRING)
- capacity (INTEGER)
- openingTime (TIME)
- closingTime (TIME)
- isActive (BOOLEAN)
```

#### 2. `meal_menus`
```sql
- id (UUID, PK)
- cafeteriaId (UUID, FK)
- mealType (ENUM: breakfast, lunch, dinner)
- menuDate (DATE)
- mainCourse (STRING)
- sideDish (STRING)
- soup (STRING)
- salad (STRING)
- dessert (STRING)
- price (DECIMAL)
- availableQuota (INTEGER)
- reservedCount (INTEGER)
- isActive (BOOLEAN)
```

#### 3. `meal_reservations`
```sql
- id (UUID, PK)
- studentId (UUID, FK → users)
- menuId (UUID, FK → meal_menus)
- reservationDate (DATETIME)
- qrCode (UUID, UNIQUE)
- status (ENUM: pending, used, cancelled, expired)
- usedAt (DATETIME)
- amountPaid (DECIMAL)
- isScholarshipMeal (BOOLEAN)
```

#### 4. `transactions`
```sql
- id (UUID, PK)
- studentId (UUID, FK → users)
- type (ENUM: deposit, withdrawal, meal_payment, refund)
- amount (DECIMAL)
- balanceBefore (DECIMAL)
- balanceAfter (DECIMAL)
- description (STRING)
- referenceId (UUID)
- referenceType (STRING)
- createdBy (UUID, FK → users)
```

## 🔌 API Endpoints

### Base URL: `/api/v1/meals`

#### 1. GET `/menus`
**Açıklama:** Mevcut yemek menülerini listele  
**Auth:** Required  
**Query Params:**
- `date` (optional): YYYY-MM-DD
- `mealType` (optional): breakfast, lunch, dinner
- `cafeteriaId` (optional): UUID

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": "uuid",
      "cafeteria": {
        "id": "uuid",
        "name": "Ana Kafeterya",
        "location": "Merkez Kampüs"
      },
      "mealType": "lunch",
      "menuDate": "2024-12-23",
      "mainCourse": "Tavuk Şinitzel",
      "sideDish": "Pilav",
      "soup": "Mercimek Çorbası",
      "salad": "Mevsim Salata",
      "dessert": "Sütlaç",
      "price": "40.00",
      "availableQuota": 200,
      "reservedCount": 45
    }
  ]
}
```

---

#### 2. POST `/reservations`
**Açıklama:** Yemek rezervasyonu oluştur  
**Auth:** Required (Student only)  
**Body:**
```json
{
  "menuId": "uuid"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Meal reservation created successfully",
  "data": {
    "id": "uuid",
    "studentId": "uuid",
    "menuId": "uuid",
    "qrCode": "generated-uuid",
    "status": "pending",
    "isScholarshipMeal": false,
    "amountPaid": "40.00",
    "reservationDate": "2024-12-22T10:30:00.000Z",
    "menu": {
      "mealType": "lunch",
      "menuDate": "2024-12-23",
      "mainCourse": "Tavuk Şinitzel",
      "cafeteria": {
        "name": "Ana Kafeterya"
      }
    }
  }
}
```

**Hata Durumları:**
- `400`: Yetersiz bakiye, günlük limit aşımı
- `404`: Menü bulunamadı
- `409`: Zaten rezerve edilmiş, kota dolu

---

#### 3. GET `/reservations`
**Açıklama:** Öğrencinin rezervasyonlarını listele  
**Auth:** Required (Student only)  
**Query Params:**
- `status` (optional): pending, used, cancelled, expired
- `startDate` (optional): YYYY-MM-DD
- `endDate` (optional): YYYY-MM-DD

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "uuid",
      "qrCode": "uuid",
      "status": "pending",
      "reservationDate": "2024-12-22T10:30:00.000Z",
      "menu": {
        "mealType": "lunch",
        "menuDate": "2024-12-23",
        "mainCourse": "Tavuk Şinitzel"
      }
    }
  ]
}
```

---

#### 4. DELETE `/reservations/:id`
**Açıklama:** Rezervasyonu iptal et  
**Auth:** Required (Student only)  
**Params:** `id` (Reservation UUID)

**Response (200):**
```json
{
  "success": true,
  "message": "Meal reservation cancelled successfully",
  "data": {
    "id": "uuid",
    "status": "cancelled"
  }
}
```

**Kısıtlamalar:**
- Aynı gün iptal edilemez
- Sadece `pending` status'ü iptal edilebilir

---

#### 5. POST `/reservations/:id/use`
**Açıklama:** QR kod ile yemek kullan (Kafeterya personeli)  
**Auth:** Required (Staff/Admin only)  
**Params:** `id` (Reservation UUID)  
**Body:**
```json
{
  "qrCode": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Meal reservation processed successfully",
  "data": {
    "id": "uuid",
    "status": "used",
    "usedAt": "2024-12-23T12:15:00.000Z",
    "amountPaid": "40.00"
  }
}
```

**İşlem Adımları:**
1. QR kod doğrulanır
2. Bugünün yemeği mi kontrol edilir
3. Ücretli öğrenci ise wallet'tan para düşer
4. Transaction kaydı oluşturulur
5. Rezervasyon `used` olarak işaretlenir

---

#### 6. GET `/transactions`
**Açıklama:** İşlem geçmişini görüntüle  
**Auth:** Required (Student only)  
**Query Params:**
- `type` (optional): deposit, withdrawal, meal_payment, refund
- `startDate` (optional): YYYY-MM-DD
- `endDate` (optional): YYYY-MM-DD
- `limit` (optional): 1-100 (default: 50)

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": "uuid",
      "type": "meal_payment",
      "amount": "40.00",
      "balanceBefore": "200.00",
      "balanceAfter": "160.00",
      "description": "Payment for lunch - Tavuk Şinitzel",
      "referenceId": "reservation-uuid",
      "referenceType": "meal_reservation",
      "createdAt": "2024-12-23T12:15:00.000Z"
    }
  ]
}
```

## 🧪 Test Senaryoları

### Senaryo 1: Burslu Öğrenci - Başarılı Rezervasyon

```bash
# 1. Login (Burslu öğrenci)
POST /api/auth/login
{
  "email": "bursliogrenci@kampus.edu.tr",
  "password": "password123"
}

# 2. Menüleri listele
GET /api/v1/meals/menus?date=2024-12-23

# 3. Rezervasyon oluştur
POST /api/v1/meals/reservations
{
  "menuId": "menu-uuid"
}

# Response: qrCode alındı, amountPaid: 0.00, isScholarshipMeal: true
```

### Senaryo 2: Ücretli Öğrenci - Yemek Kullanımı

```bash
# 1. Login (Ücretli öğrenci)
POST /api/auth/login
{
  "email": "ucretliogrenci@kampus.edu.tr",
  "password": "password123"
}

# 2. Rezervasyon oluştur (bakiye yeterli mi kontrol edilir)
POST /api/v1/meals/reservations
{
  "menuId": "menu-uuid"
}

# 3. Kafeterya personeli yemek kullanımını işaretler
# (Burada PARA DÜŞER)
POST /api/v1/meals/reservations/{reservation-id}/use
Authorization: Bearer {staff-token}
{
  "qrCode": "generated-uuid"
}

# 4. İşlem geçmişini kontrol et
GET /api/v1/meals/transactions
```

### Senaryo 3: Günlük Limit Kontrolü (Burslu)

```bash
# 1. İlk rezervasyon (Başarılı)
POST /api/v1/meals/reservations
{ "menuId": "breakfast-menu-uuid" }

# 2. İkinci rezervasyon (Başarılı)
POST /api/v1/meals/reservations
{ "menuId": "lunch-menu-uuid" }

# 3. Üçüncü rezervasyon (HATA: Günlük limit aşıldı)
POST /api/v1/meals/reservations
{ "menuId": "dinner-menu-uuid" }

# Response: 400
{
  "success": false,
  "error": "Scholarship students can reserve maximum 2 meals per day"
}
```

### Senaryo 4: Yetersiz Bakiye

```bash
# Student wallet balance: 20.00 TL
# Meal price: 40.00 TL

POST /api/v1/meals/reservations
{ "menuId": "lunch-menu-uuid" }

# Response: 400
{
  "success": false,
  "error": "Insufficient wallet balance. Required: 40.00, Available: 20.00"
}
```

## 🚀 Kurulum ve Çalıştırma

### 1. Migration'ları Çalıştır

```bash
cd web-programlama-final-proje-backend
npm run db:migrate
```

### 2. Seed Data Ekle

```bash
npm run db:seed
```

### 3. Backend'i Başlat

```bash
npm run dev
```

### 4. Swagger UI'da Test Et

```
http://localhost:3000/api-docs
```

**Meals** section'ında tüm endpoint'leri görebilir ve test edebilirsiniz.

## 📊 Database İlişkileri

```
users (students)
  ├─ 1:N → meal_reservations
  └─ 1:N → transactions

cafeterias
  └─ 1:N → meal_menus
               └─ 1:N → meal_reservations

meal_reservations
  ├─ N:1 → users (student)
  ├─ N:1 → meal_menus
  └─ 1:1 → transactions (reference)
```

## 🔒 Güvenlik

- JWT authentication zorunlu
- Role-based access control (Student, Staff, Admin)
- QR kod UUID ile güvenli
- Transaction integrity (ACID)
- Input validation (express-validator)
- SQL injection koruması (Sequelize ORM)

## 📈 Performans

- Database indexleri:
  - `meal_menus`: (cafeteriaId, menuDate, mealType)
  - `meal_reservations`: (studentId, reservationDate, status)
  - `transactions`: (studentId, createdAt)
- Row-level locking (eşzamanlılık)
- Optimized queries (include, eager loading)

## 🎨 Frontend Entegrasyonu

Frontend'de kullanılabilecek örnek flow:

```javascript
// 1. Menüleri listele
const menus = await api.get('/api/v1/meals/menus?date=2024-12-23');

// 2. Rezervasyon oluştur
const reservation = await api.post('/api/v1/meals/reservations', {
  menuId: selectedMenu.id
});

// 3. QR kodu göster (qrcode.react)
<QRCode value={reservation.data.qrCode} size={256} />

// 4. Rezervasyonları listele
const myReservations = await api.get('/api/v1/meals/reservations?status=pending');

// 5. İşlem geçmişi
const transactions = await api.get('/api/v1/meals/transactions?limit=20');
```

## ✅ Tamamlanan Geliştirmeler

- [x] Migration dosyaları (4 tablo)
- [x] Sequelize modelleri
- [x] Service layer (business logic)
- [x] Controller layer
- [x] Routes (6 endpoint)
- [x] Swagger documentation
- [x] Seed data
- [x] ACID transactions
- [x] Error handling
- [x] Validation middleware
- [x] Role-based guards

## 📝 Notlar

- Wallet balance Student model'inde tutuluyor (`students.walletBalance`)
- Admin/Staff manuel olarak wallet'a para yükleyebilir (deposit transaction)
- Expired rezervasyonlar için cron job eklenebilir (gelecek geliştirme)
- Email/SMS bildirimleri eklenebilir

---

**Part 3 Tamamlandı! 🎉**

