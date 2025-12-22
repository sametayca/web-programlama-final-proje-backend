# 🚀 SendGrid Hızlı Kurulum

## 1️⃣ SendGrid Hesabı Oluştur
- https://sendgrid.com → "Start for Free"
- Email doğrula

## 2️⃣ API Key Oluştur
- https://app.sendgrid.com/settings/api_keys
- "Create API Key" → İsim ver → "Full Access" → Kopyala ⚠️

## 3️⃣ Email Adresini Doğrula
- https://app.sendgrid.com/settings/sender_auth
- "Verify a Single Sender" → Formu doldur → Email'i doğrula

## 4️⃣ .env Dosyasını Güncelle

Mevcut email ayarlarını sil, şunları ekle:

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=your-verified-email@example.com
EMAIL_FROM_NAME=Web Programlama Final Projesi
```

## 5️⃣ Backend'i Yeniden Başlat

Backend terminalinde `rs` yazın veya Ctrl+C → `npm run dev`

## ✅ Test

Yeni kullanıcı kaydedin, e-posta gelmeli!

---

**Detaylı rehber:** `EMAIL_SETUP.md` dosyasına bakın.





