# 🎉 EVENT MANAGEMENT MODULE

## 📋 Genel Bakış

Kampüs etkinliklerinin yönetimi, kayıt sistemi ve QR kod ile check-in özelliği.

---

## 🎯 Özellikler

### ✅ Event CRUD
- Event oluşturma (Faculty, Admin, Staff)
- Event güncelleme (Sadece organizer)
- Event silme (Soft delete)
- Event listeleme (Public)
- Event detayı (Public)

### ✅ Registration System
- Etkinliğe kayıt olma
- Kapasite kontrolü (atomic)
- Çift kayıt engelleme (unique constraint)
- QR code oluşturma (UUID)
- Approval sistemi (opsiyonel)

### ✅ Check-in System
- QR kod ile giriş
- Bir kez check-in (duplicate prevention)
- Zaman kontrolü (event saatleri içinde)
- Staff/Admin/Faculty yetkisi

---

## 🗄️ Database Schema

### events
```sql
id                  UUID PK
title               STRING(200)
description         TEXT
eventType           ENUM(seminar, workshop, conference, social, sports, cultural, other)
startDate           DATETIME
endDate             DATETIME
location            STRING(200)
capacity            INTEGER
registeredCount     INTEGER DEFAULT 0
organizer           STRING(200)
organizerId         UUID FK → users
imageUrl            STRING(500)
isActive            BOOLEAN DEFAULT true
requiresApproval    BOOLEAN DEFAULT false
createdAt           DATETIME
updatedAt           DATETIME
```

**Indexes:**
- startDate
- eventType
- isActive
- organizerId

---

### event_registrations
```sql
id              UUID PK
eventId         UUID FK → events (CASCADE)
userId          UUID FK → users (CASCADE)
qrCode          UUID UNIQUE
status          ENUM(pending, approved, rejected, cancelled)
checkedIn       BOOLEAN DEFAULT false
checkedInAt     DATETIME
registeredAt    DATETIME
notes           TEXT
createdAt       DATETIME
updatedAt       DATETIME
```

**Indexes:**
- eventId
- userId
- qrCode
- status
- checkedIn
- **UNIQUE(eventId, userId)** - Çift kayıt engelleme

---

## 🔌 API Endpoints

### Base URL: `/api/v1/events`

---

### 1. GET `/` - List Events

**Access:** Public

**Query Params:**
```javascript
eventType: 'seminar' | 'workshop' | 'conference' | 'social' | 'sports' | 'cultural' | 'other'
startDate: 'YYYY-MM-DD'
endDate: 'YYYY-MM-DD'
isActive: true | false
page: 1
limit: 20
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 20,
    "pages": 1
  },
  "data": [
    {
      "id": "uuid",
      "title": "Yapay Zeka Workshop",
      "eventType": "workshop",
      "startDate": "2024-12-29T14:00:00.000Z",
      "endDate": "2024-12-29T17:00:00.000Z",
      "location": "Lab B304",
      "capacity": 30,
      "registeredCount": 12,
      "organizer": "Prof. Dr. Ayşe Yılmaz",
      "organizerUser": {
        "id": "uuid",
        "firstName": "Ayşe",
        "lastName": "Yılmaz"
      }
    }
  ]
}
```

---

### 2. GET `/:id` - Event Details

**Access:** Public

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Yapay Zeka Workshop",
    "description": "Python ile makine öğrenmesi...",
    "eventType": "workshop",
    "startDate": "2024-12-29T14:00:00.000Z",
    "endDate": "2024-12-29T17:00:00.000Z",
    "location": "Lab B304",
    "capacity": 30,
    "registeredCount": 12,
    "imageUrl": "https://...",
    "isActive": true,
    "requiresApproval": false
  }
}
```

---

### 3. POST `/` - Create Event

**Access:** Faculty, Admin, Staff

**Body:**
```json
{
  "title": "Yapay Zeka Workshop",
  "description": "Python ile makine öğrenmesi",
  "eventType": "workshop",
  "startDate": "2024-12-29T14:00:00.000Z",
  "endDate": "2024-12-29T17:00:00.000Z",
  "location": "Lab B304",
  "capacity": 30,
  "organizer": "Prof. Dr. Ayşe Yılmaz",
  "imageUrl": "https://...",
  "requiresApproval": false
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "id": "uuid",
    "title": "Yapay Zeka Workshop",
    ...
  }
}
```

---

### 4. PUT `/:id` - Update Event

**Access:** Organizer only

**Body:**
```json
{
  "title": "Updated Title",
  "capacity": 40
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Event updated successfully",
  "data": { ... }
}
```

---

### 5. DELETE `/:id` - Delete Event

**Access:** Organizer only

**Response (200):**
```json
{
  "success": true,
  "message": "Event deleted successfully"
}
```

**Note:** Soft delete (isActive = false)

---

### 6. POST `/:id/register` - Register for Event

**Access:** Authenticated users

**Response (201):**
```json
{
  "success": true,
  "message": "Successfully registered for event",
  "data": {
    "id": "registration-uuid",
    "eventId": "event-uuid",
    "userId": "user-uuid",
    "qrCode": "qr-uuid",
    "status": "approved",
    "checkedIn": false,
    "registeredAt": "2024-12-22T10:30:00.000Z",
    "event": {
      "id": "event-uuid",
      "title": "Yapay Zeka Workshop",
      "startDate": "2024-12-29T14:00:00.000Z",
      "location": "Lab B304"
    }
  }
}
```

**Business Rules:**
1. ✅ Kapasite kontrolü (atomic increment)
2. ✅ Çift kayıt engelleme
3. ✅ Başlamış etkinliğe kayıt yok
4. ✅ QR code UUID ile oluşturulur
5. ✅ requiresApproval = true ise status: 'pending'

---

### 7. POST `/:eventId/registrations/:regId/checkin` - Check-in

**Access:** Staff, Admin, Faculty

**Body:**
```json
{
  "qrCode": "qr-uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Check-in successful",
  "data": {
    "registrationId": "uuid",
    "userId": "user-uuid",
    "userName": "Ali Veli",
    "eventTitle": "Yapay Zeka Workshop",
    "checkedInAt": "2024-12-29T14:15:00.000Z"
  }
}
```

**Business Rules:**
1. ✅ QR code doğrulaması
2. ✅ Status = 'approved' kontrolü
3. ✅ Bir kez check-in (duplicate prevention)
4. ✅ Event saatleri içinde mi kontrolü
5. ✅ Zaman: startDate <= now <= endDate

---

### 8. GET `/my-registrations` - User's Registrations

**Access:** Authenticated users

**Query Params:**
```javascript
status: 'pending' | 'approved' | 'rejected' | 'cancelled'
upcoming: true | false
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "uuid",
      "qrCode": "qr-uuid",
      "status": "approved",
      "checkedIn": false,
      "registeredAt": "2024-12-22T10:30:00.000Z",
      "event": {
        "title": "Yapay Zeka Workshop",
        "startDate": "2024-12-29T14:00:00.000Z",
        "location": "Lab B304"
      }
    }
  ]
}
```

---

### 9. GET `/:id/registrations` - Event Registrations

**Access:** Organizer only

**Response:**
```json
{
  "success": true,
  "count": 12,
  "data": [
    {
      "id": "uuid",
      "status": "approved",
      "checkedIn": true,
      "checkedInAt": "2024-12-29T14:10:00.000Z",
      "user": {
        "id": "uuid",
        "firstName": "Ali",
        "lastName": "Veli",
        "email": "ali@kampus.edu.tr",
        "role": "student"
      }
    }
  ]
}
```

---

## 🧪 Test Senaryoları

### Senaryo 1: Event Oluşturma ve Kayıt

```bash
# 1. Login (Faculty)
POST /api/auth/login
{
  "email": "faculty@kampus.edu.tr",
  "password": "password123"
}

# 2. Event oluştur
POST /api/v1/events
Authorization: Bearer {token}
{
  "title": "AI Workshop",
  "eventType": "workshop",
  "startDate": "2024-12-29T14:00:00Z",
  "endDate": "2024-12-29T17:00:00Z",
  "location": "Lab B304",
  "capacity": 30
}

# 3. Student login
POST /api/auth/login
{
  "email": "student@kampus.edu.tr",
  "password": "password123"
}

# 4. Etkinliğe kayıt ol
POST /api/v1/events/{event-id}/register
Authorization: Bearer {student-token}

# Response: qrCode alındı ✅
```

---

### Senaryo 2: Kapasite Kontrolü

```bash
# Event capacity: 2

# 1. İlk kayıt (Başarılı)
POST /api/v1/events/{event-id}/register
# registeredCount: 0 → 1

# 2. İkinci kayıt (Başarılı)
POST /api/v1/events/{event-id}/register
# registeredCount: 1 → 2

# 3. Üçüncü kayıt (HATA)
POST /api/v1/events/{event-id}/register

# Response: 409
{
  "success": false,
  "error": "Event is full"
}
```

---

### Senaryo 3: QR Check-in

```bash
# 1. Staff login
POST /api/auth/login
{
  "email": "staff@kampus.edu.tr",
  "password": "password123"
}

# 2. QR kod ile check-in
POST /api/v1/events/{event-id}/registrations/{reg-id}/checkin
Authorization: Bearer {staff-token}
{
  "qrCode": "qr-uuid-from-registration"
}

# Response: 200
{
  "success": true,
  "message": "Check-in successful",
  "data": {
    "userName": "Ali Veli",
    "checkedInAt": "2024-12-29T14:10:00.000Z"
  }
}

# 3. Tekrar check-in dene (HATA)
# Response: 409
{
  "error": "Already checked in at 12/29/2024, 2:10:00 PM"
}
```

---

### Senaryo 4: Çift Kayıt Engelleme

```bash
# 1. İlk kayıt (Başarılı)
POST /api/v1/events/{event-id}/register

# 2. Aynı user tekrar kayıt dener (HATA)
POST /api/v1/events/{event-id}/register

# Response: 409
{
  "success": false,
  "error": "You are already registered for this event"
}
```

---

## 🔒 Authorization Matrix

| Endpoint | Public | Student | Faculty | Staff | Admin |
|----------|--------|---------|---------|-------|-------|
| GET /events | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /events/:id | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /events | ❌ | ❌ | ✅ | ✅ | ✅ |
| PUT /events/:id | ❌ | ❌ | ✅ (owner) | ✅ (owner) | ✅ (owner) |
| DELETE /events/:id | ❌ | ❌ | ✅ (owner) | ✅ (owner) | ✅ (owner) |
| POST /register | ❌ | ✅ | ✅ | ✅ | ✅ |
| POST /checkin | ❌ | ❌ | ✅ | ✅ | ✅ |
| GET /my-registrations | ❌ | ✅ | ✅ | ✅ | ✅ |
| GET /:id/registrations | ❌ | ❌ | ✅ (owner) | ✅ (owner) | ✅ (owner) |

---

## 📊 Atomic Operations

### registeredCount Increment

```javascript
// ❌ WRONG (Race condition)
const event = await Event.findByPk(eventId);
event.registeredCount += 1;
await event.save();

// ✅ CORRECT (Atomic)
await event.increment('registeredCount', { transaction: t });
```

### Row-level Locking

```javascript
const event = await Event.findByPk(eventId, {
  transaction: t,
  lock: t.LOCK.UPDATE // 🔒 Row-level lock
});

// Capacity check
if (event.registeredCount >= event.capacity) {
  throw new Error('Event is full');
}
```

---

## 🎨 Frontend Integration (React Example)

```javascript
// 1. List events
const events = await api.get('/api/v1/events?eventType=workshop');

// 2. Register for event
const registration = await api.post(`/api/v1/events/${eventId}/register`);

// 3. Display QR code
import QRCode from 'qrcode.react';

<QRCode 
  value={registration.data.qrCode} 
  size={256}
  level="H"
/>

// 4. My registrations
const myRegs = await api.get('/api/v1/events/my-registrations?upcoming=true');

// 5. Check-in (Staff app)
const scanner = new QRScanner();
const qrCode = await scanner.scan();

await api.post(`/api/v1/events/${eventId}/registrations/${regId}/checkin`, {
  qrCode
});
```

---

## 📈 Database Optimization

### Indexes
```sql
CREATE INDEX idx_events_start_date ON events(startDate);
CREATE INDEX idx_events_event_type ON events(eventType);
CREATE INDEX idx_event_registrations_event_id ON event_registrations(eventId);
CREATE UNIQUE INDEX idx_unique_event_user ON event_registrations(eventId, userId);
```

### Performance
- **Pagination:** Default 20, max 100
- **Eager loading:** Include relations
- **Query optimization:** WHERE clauses on indexed columns

---

## ✅ Checklist

- [x] Migrations (events, event_registrations)
- [x] Models (Event, EventRegistration)
- [x] Service layer (eventService.js)
- [x] Controller (eventController.js)
- [x] Routes (eventRoutes.js)
- [x] Swagger documentation
- [x] Seed data (5 demo events)
- [x] Atomic operations (registeredCount)
- [x] Row-level locking
- [x] QR code generation (UUID)
- [x] Check-in logic
- [x] Authorization checks
- [x] Validation middleware
- [x] Error handling
- [x] Duplicate prevention (unique index)

---

## 🚀 Çalıştırma

```bash
# 1. Migration
npm run db:migrate

# 2. Seed
npm run db:seed

# 3. Backend başlat
npm run dev

# 4. Test et
http://localhost:3000/api-docs
→ Events section
```

---

## 🎉 Özet

| Özellik | Durum |
|---------|-------|
| **Event CRUD** | ✅ Tam |
| **Registration** | ✅ Kapasite + Duplicate check |
| **QR Code** | ✅ UUID |
| **Check-in** | ✅ Bir kez + Zaman kontrolü |
| **Atomic Counter** | ✅ increment() |
| **Row Locking** | ✅ LOCK.UPDATE |
| **Authorization** | ✅ Role-based |
| **Swagger Docs** | ✅ Tam |
| **Seed Data** | ✅ 5 event |

---

**HAZIR! 🎉**

**Swagger:** http://localhost:3000/api-docs → Events

