# ⚡ Wallet Payment - Quick Start

## 🎯 Ne Eklendi?

✅ **3 Wallet Endpoint**
- `GET /api/v1/wallet/balance` - Bakiye getir
- `POST /api/v1/wallet/topup` - Ödeme intent oluştur
- `GET /api/v1/wallet/transactions` - İşlem geçmişi

✅ **Stripe TEST MODE Entegrasyonu**
- Minimum yükleme: 50 TL
- Webhook endpoint: `POST /api/v1/wallet/topup/webhook`

✅ **Otomatik İşlemler (Webhook)**
- Ödeme başarılıysa → Wallet balance artır
- Transaction kaydı oluştur
- Email notification gönder

✅ **Servis Katmanları**
- `PaymentService` - Stripe API entegrasyonu
- `WebhookService` - Webhook handling + Email

✅ **Sequelize Transaction (ACID)**
- Row-level locking
- Rollback mekanizması
- balanceBefore/After tracking

---

## 📦 Oluşturulan Dosyalar

```
src/
├── config/
│   └── stripe.js                    ✅ Stripe client
├── services/
│   ├── paymentService.js            ✅ Payment logic
│   └── webhookService.js            ✅ Webhook + Email
├── controllers/
│   └── walletController.js          ✅ 4 controller
├── routes/
│   └── walletRoutes.js              ✅ 4 routes + Swagger
└── server.js                        ✅ Raw body parser eklendi
```

**Docs:**
- `WALLET_PAYMENT_SETUP.md` - Detaylı setup guide
- `WALLET_PAYMENT_QUICK_START.md` - Bu dosya

---

## ⚙️ .env Ayarları

`.env` dosyanıza ekleyin:

```env
# Stripe TEST MODE
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Stripe keys almak için:**
```
https://dashboard.stripe.com/test/apikeys
```

---

## 🧪 Test Etmek İçin

### 1. Backend Başlat
```bash
cd web-programlama-final-proje-backend
npm run dev
```

### 2. Stripe CLI (Webhook için)
```bash
stripe listen --forward-to http://localhost:3000/api/v1/wallet/topup/webhook
```

### 3. Swagger'da Test Et
```
http://localhost:3000/api-docs
→ Wallet section
```

### 4. Postman/Thunder Client

**Step 1: Login (Student)**
```
POST http://localhost:3000/api/auth/login
{
  "email": "student@email.com",
  "password": "password123"
}
```

**Step 2: Bakiye Kontrol**
```
GET http://localhost:3000/api/v1/wallet/balance
Authorization: Bearer YOUR_TOKEN
```

**Step 3: Payment Intent Oluştur**
```
POST http://localhost:3000/api/v1/wallet/topup
Authorization: Bearer YOUR_TOKEN
{
  "amount": 100
}
```

**Response → clientSecret alın**

**Step 4: Ödeme Yap (Frontend'de Stripe Elements)**
```javascript
// Test card: 4242 4242 4242 4242
stripe.confirmCardPayment(clientSecret, {
  payment_method: { card: cardElement }
});
```

**Step 5: Webhook Otomatik Gelir**
```
Stripe CLI console'da göreceksiniz:
→ payment_intent.succeeded
→ Wallet balance güncellendi!
```

**Step 6: İşlem Geçmişi**
```
GET http://localhost:3000/api/v1/wallet/transactions
Authorization: Bearer YOUR_TOKEN
```

---

## 🎴 Test Credit Cards

### ✅ Başarılı
```
4242 4242 4242 4242
Expiry: 12/34
CVC: 123
```

### ❌ Başarısız (Yetersiz Bakiye)
```
4000 0000 0000 9995
```

---

## 📊 Database Flow

```sql
-- Ödeme öncesi
SELECT walletBalance FROM students WHERE userId = 'student-id';
-- 20.00

-- Webhook gelir → PaymentService.handlePaymentSuccess()
-- Transaction başlar (LOCK)
UPDATE students SET walletBalance = 120.00 WHERE userId = 'student-id';
INSERT INTO transactions (...);
-- Transaction commit

-- Ödeme sonrası
SELECT walletBalance FROM students WHERE userId = 'student-id';
-- 120.00
```

---

## 🔒 Security

✅ JWT authentication zorunlu  
✅ Student role kontrolü  
✅ Webhook signature verification  
✅ Input validation (express-validator)  
✅ Transaction ACID compliance  
✅ Rate limiting aktif  

---

## 📧 Email Notification

Ödeme başarılı olunca otomatik email:

```
Konu: 💰 Cüzdan Yükleme Başarılı

Yüklenen Tutar: 100.00 TL
Yeni Bakiye: 120.00 TL

Artık kampüs kafeteryalarından yemek rezervasyonu yapabilirsiniz!
```

---

## 🐛 Troubleshooting

### "Webhook signature verification failed"
→ Stripe CLI'da `stripe listen` çalışıyor mu kontrol et  
→ `.env`'de `STRIPE_WEBHOOK_SECRET` doğru mu?

### "Minimum top-up amount is 50 TL"
→ Amount >= 50 olmalı

### Email gönderilmiyor
→ SMTP bilgileri `.env`'de doğru mu?  
→ Gmail için App Password kullan

### Transaction rollback
→ Logs kontrol et: `logs/combined.log`  
→ PostgreSQL çalışıyor mu?

---

## ✅ Production'a Geçiş

1. Stripe Live Mode aktif et
2. Live API keys al
3. `.env` güncelle
4. Production webhook endpoint ekle
5. KYC doğrulaması yap

---

## 🎉 Hazır!

Stripe TEST MODE tam entegre! 

**Swagger:** http://localhost:3000/api-docs  
**Endpoint:** `/api/v1/wallet/*`

**Detaylı docs:** `WALLET_PAYMENT_SETUP.md`

