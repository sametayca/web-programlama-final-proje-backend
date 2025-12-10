# 📧 SendGrid HTTP API Kurulum Rehberi

E-posta gönderimi için SendGrid HTTP API kullanılmaktadır. SendGrid, HTTPS (443) portu üzerinden çalıştığı için firewall sorunları yaşanmaz.

## 🎯 Avantajlar

- ✅ **Firewall Sorunu Yok**: HTTPS (443) portu her zaman açıktır
- ✅ **Daha Hızlı**: HTTP API, SMTP'den daha hızlıdır
- ✅ **Daha Güvenilir**: Modern email servisleri HTTP API kullanır
- ✅ **Daha İyi Tracking**: Email açılma, tıklama istatistikleri
- ✅ **Kolay Entegrasyon**: RESTful API, kolay kullanım

---

## 📋 Adım 1: SendGrid Hesabı Oluşturma

### 1.1 SendGrid Web Sitesine Gidin

1. Tarayıcınızda https://sendgrid.com adresine gidin
2. Sağ üst köşedeki **"Start for Free"** butonuna tıklayın

### 1.2 Hesap Oluşturun

1. **Email adresinizi** girin
2. **Şifre oluşturun** (güçlü bir şifre seçin)
3. **Hesap bilgilerinizi** doldurun:
   - İsim, Soyisim
   - Şirket/Organizasyon adı (opsiyonel)
   - Telefon numarası (opsiyonel)
4. **"Create Account"** butonuna tıklayın

### 1.3 Email Doğrulama

1. Gelen email'i kontrol edin (Spam klasörüne de bakın)
2. Email'deki **"Verify Your Email"** butonuna tıklayın
3. Email adresiniz doğrulanacak

---

## 📋 Adım 2: SendGrid API Key Oluşturma

### 2.1 SendGrid Dashboard'a Giriş Yapın

1. https://app.sendgrid.com adresine gidin
2. Oluşturduğunuz hesap bilgileriyle giriş yapın

### 2.2 API Keys Bölümüne Gidin

**Yöntem 1:**
- Sol menüden **Settings** (⚙️) ikonuna tıklayın
- Açılan menüden **"API Keys"** seçeneğine tıklayın

**Yöntem 2:**
- Direkt URL: https://app.sendgrid.com/settings/api_keys

### 2.3 Yeni API Key Oluşturun

1. **"Create API Key"** butonuna tıklayın
2. **API Key Name** alanına bir isim girin:
   - Örnek: `smart-campus-backend` veya `nodejs-email-service`
3. **API Key Permissions** seçeneğini seçin:
   - **"Full Access"** (Önerilen - Tüm işlemler için)
   - Veya **"Restricted Access"** → **"Mail Send"** seçeneğini aktif edin
4. **"Create & View"** butonuna tıklayın

### 2.4 API Key'i Kopyalayın

⚠️ **ÇOK ÖNEMLİ:** API Key sadece bir kez gösterilir! Hemen kopyalayın.

1. Açılan pencerede API Key'inizi görürsünüz
2. Format: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
3. **"Copy"** butonuna tıklayarak API Key'i kopyalayın
4. Güvenli bir yere kaydedin (notepad, password manager, vb.)

**Not:** API Key'i kaybetmeniz durumunda yeni bir tane oluşturmanız gerekir.

---

## 📋 Adım 3: SendGrid "From" Email Adresini Doğrulama

SendGrid, gönderen email adresinin doğrulanmış olmasını gerektirir. Bu adım **zorunludur**.

### 3.1 Sender Authentication Bölümüne Gidin

1. Sol menüden **Settings** (⚙️) → **"Sender Authentication"** seçin
2. Veya direkt URL: https://app.sendgrid.com/settings/sender_auth

### 3.2 Single Sender Verification (Hızlı Başlangıç)

**Adım 1:**
1. **"Verify a Single Sender"** butonuna tıklayın
2. **"Create a Sender"** butonuna tıklayın

**Adım 2: Formu Doldurun**
- **From Email Address:** Gönderen email adresiniz
  - Örnek: `noreply@smartcampus.edu.tr` veya `your-email@gmail.com`
- **From Name:** Gönderen ismi
  - Örnek: `Smart Campus` veya `Web Programlama Final Projesi`
- **Reply To:** Yanıt adresi (genellikle aynı email)
- **Company Address:** Şirket adresi (zorunlu)
- **City:** Şehir
- **State:** İl/Eyalet
- **Country:** Ülke
- **Zip Code:** Posta kodu

**Adım 3:**
1. **"Create"** butonuna tıklayın
2. SendGrid size bir doğrulama emaili gönderecek

**Adım 4: Email'i Doğrulayın**
1. Belirttiğiniz email adresinizi kontrol edin
2. SendGrid'den gelen email'i açın
3. Email içindeki **"Verify Single Sender"** butonuna tıklayın
4. Veya email'deki linki tarayıcınıza yapıştırın

**Adım 5: Doğrulama Kontrolü**
1. SendGrid Dashboard'a geri dönün
2. **Settings** → **Sender Authentication** → **Single Sender Verification**
3. Email adresinizin yanında **"Verified"** yazısını görmelisiniz

### 3.3 Domain Authentication (Production için Önerilen)

Eğer kendi domain'iniz varsa (örn: `smartcampus.edu.tr`), Domain Authentication yapmanız önerilir:

1. **"Authenticate Your Domain"** butonuna tıklayın
2. Domain'inizi girin (örn: `smartcampus.edu.tr`)
3. SendGrid size DNS kayıtları verecek
4. Bu kayıtları domain'inizin DNS ayarlarına ekleyin
5. DNS kayıtlarını ekledikten sonra **"Verify"** butonuna tıklayın

**Not:** Domain Authentication yapmak email deliverability'yi artırır ve spam klasörüne düşme riskini azaltır.

---

## 📋 Adım 4: .env Dosyasını Yapılandırın

Backend klasöründe `.env` dosyasını açın ve şu satırları ekleyin/güncelleyin:

```env
# Email Configuration (SendGrid HTTP API)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=your-verified-email@example.com
EMAIL_FROM_NAME=Web Programlama Final Projesi

# Frontend URL (e-postalardaki linkler için)
FRONTEND_URL=http://192.168.60.97:3001
```

**Önemli:**
- `SENDGRID_API_KEY`: SendGrid Dashboard'dan kopyaladığınız API Key (SG. ile başlar)
- `EMAIL_FROM`: SendGrid'de doğruladığınız email adresi
- `EMAIL_FROM_NAME`: Gönderen ismi (opsiyonel)

---

## 📋 Adım 5: Backend'i Yeniden Başlatın

```bash
npm run dev
```

Terminal'de şu mesajı görmelisiniz:
```
✅ EMAIL SERVICE: SendGrid HTTP API yapılandırıldı.
```

---

## 📋 Adım 6: Test Edin

1. Kayıt sayfasından yeni bir kullanıcı oluşturun
2. E-posta kutunuzu kontrol edin (Spam klasörünü de kontrol edin)
3. Doğrulama linkine tıklayın

---

## 🐛 Sorun Giderme

### "Forbidden" veya "Unauthorized" hatası
- API Key'in doğru kopyalandığından emin olun
- API Key'in "Mail Send" iznine sahip olduğundan emin olun

### "The from address does not match a verified Sender Identity" hatası
- `EMAIL_FROM` adresinin SendGrid'de doğrulanmış olduğundan emin olun
- Single Sender Verification'ı kontrol edin

### E-postalar gelmiyor
- Spam klasörünü kontrol edin
- Backend terminal'inde hata mesajı var mı kontrol edin
- `.env` dosyasındaki `SENDGRID_API_KEY` değerini kontrol edin

### Geliştirme Modu

E-posta yapılandırması yoksa, sistem otomatik olarak **geliştirme moduna** geçer ve e-postalar konsola yazdırılır. Terminal'de şu mesajı göreceksiniz:

```
⚠️  EMAIL SERVICE: SendGrid API Key bulunamadı. E-postalar konsola yazdırılacak.
```

Bu durumda e-posta linklerini terminal çıktısından alabilirsiniz.

---

## 📚 Daha Fazla Bilgi

- [SendGrid Documentation](https://docs.sendgrid.com/)
- [SendGrid Node.js Library](https://github.com/sendgrid/sendgrid-nodejs)
- [SendGrid API Reference](https://docs.sendgrid.com/api-reference)
