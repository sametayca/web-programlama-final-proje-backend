# ⚡ Event Management - Quick Summary

## ✅ Ne Eklendi?

### 📦 2 Tablo
- `events` - Etkinlik bilgileri
- `event_registrations` - Kayıt ve check-in

### 🔌 9 Endpoint
```
GET    /api/v1/events                                      - List events
GET    /api/v1/events/:id                                  - Event details
POST   /api/v1/events                                      - Create event
PUT    /api/v1/events/:id                                  - Update event
DELETE /api/v1/events/:id                                  - Delete event
POST   /api/v1/events/:id/register                         - Register
POST   /api/v1/events/:eventId/registrations/:regId/checkin - Check-in
GET    /api/v1/events/my-registrations                     - My registrations
GET    /api/v1/events/:id/registrations                    - Event registrations
```

### 🎯 İş Kuralları
✅ Kapasite kontrolü (atomic increment)  
✅ Çift kayıt engelleme (unique constraint)  
✅ QR code UUID  
✅ Check-in bir kez  
✅ Zaman kontrolü (event saatleri)  
✅ Role-based authorization  

---

## 📁 Oluşturulan Dosyalar

```
migrations/
├── 20241222000005-create-events.js              ✅
└── 20241222000006-create-event-registrations.js ✅

models/
├── Event.js                                      ✅
└── EventRegistration.js                          ✅

services/
└── eventService.js                               ✅ (450+ satır)

controllers/
└── eventController.js                            ✅ (8 function)

routes/
└── eventRoutes.js                                ✅ (9 endpoint + Swagger)

seeders/
└── 20241222000002-demo-events.js                 ✅ (5 event)

docs/
├── EVENT_MANAGEMENT.md                           ✅ (Detaylı)
└── EVENT_MANAGEMENT_SUMMARY.md                   ✅ (Bu dosya)
```

---

## 🧪 Hızlı Test

### 1. Migration + Seed
```bash
cd web-programlama-final-proje-backend
npm run db:migrate
npm run db:seed
npm run dev
```

### 2. Swagger
```
http://localhost:3000/api-docs
→ Events section
```

### 3. API Test (Postman)

**Create Event (Faculty):**
```bash
POST /api/v1/events
Authorization: Bearer {faculty-token}
{
  "title": "AI Workshop",
  "eventType": "workshop",
  "startDate": "2024-12-29T14:00:00Z",
  "endDate": "2024-12-29T17:00:00Z",
  "location": "Lab B304",
  "capacity": 30
}
```

**Register (Student):**
```bash
POST /api/v1/events/{event-id}/register
Authorization: Bearer {student-token}

# Response → qrCode alırsınız
```

**Check-in (Staff):**
```bash
POST /api/v1/events/{eventId}/registrations/{regId}/checkin
Authorization: Bearer {staff-token}
{
  "qrCode": "qr-uuid-from-registration"
}

# Response → Check-in successful ✅
```

---

## 🔑 Key Features

### Atomic Counter
```javascript
// Row-level lock + atomic increment
const event = await Event.findByPk(eventId, {
  transaction: t,
  lock: t.LOCK.UPDATE
});

await event.increment('registeredCount', { transaction: t });
```

### Duplicate Prevention
```sql
CREATE UNIQUE INDEX idx_unique_event_user 
ON event_registrations(eventId, userId);
```

### QR Code
```javascript
const qrCode = uuidv4(); // UUID format
```

### Check-in Logic
```javascript
// 1. QR code doğrula
// 2. Status = 'approved' kontrolü
// 3. Zaten check-in edilmiş mi?
// 4. Event zamanı doğru mu?
// 5. Check-in yap (bir kez)
```

---

## 📊 Database Schema

```
events
├── id (UUID PK)
├── title
├── eventType (ENUM)
├── startDate
├── endDate
├── capacity
├── registeredCount
└── organizerId (FK)

event_registrations
├── id (UUID PK)
├── eventId (FK)
├── userId (FK)
├── qrCode (UUID UNIQUE)
├── status (ENUM)
├── checkedIn (BOOLEAN)
└── checkedInAt
    └── UNIQUE(eventId, userId)
```

---

## 🔒 Authorization

| Action | Student | Faculty | Staff | Admin |
|--------|---------|---------|-------|-------|
| Create Event | ❌ | ✅ | ✅ | ✅ |
| Update Event | ❌ | ✅ (owner) | ✅ (owner) | ✅ (owner) |
| Register | ✅ | ✅ | ✅ | ✅ |
| Check-in | ❌ | ✅ | ✅ | ✅ |

---

## 🎨 Frontend Example

```javascript
// QR Code Display
import QRCode from 'qrcode.react';

<QRCode 
  value={registration.qrCode} 
  size={256}
  level="H"
/>

// Check-in Scanner
const scanner = new QRScanner();
const qrCode = await scanner.scan();

await api.post(`/api/v1/events/${eventId}/registrations/${regId}/checkin`, {
  qrCode
});
```

---

## ✅ Checklist

- [x] Migrations (2 tablo)
- [x] Models (Event, EventRegistration)
- [x] Service layer (eventService.js)
- [x] Controller (eventController.js)
- [x] Routes (eventRoutes.js)
- [x] Swagger docs
- [x] Seed data (5 event)
- [x] Atomic operations
- [x] Row locking
- [x] QR code (UUID)
- [x] Check-in logic
- [x] Authorization
- [x] Validation
- [x] Error handling
- [x] Linter hatasız

---

## 🎉 HAZIR!

**Swagger:** http://localhost:3000/api-docs → Events  
**Detaylı Docs:** `EVENT_MANAGEMENT.md`

**Test et ve eğlen! 🚀**

