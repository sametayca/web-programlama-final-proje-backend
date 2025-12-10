# API Dokümantasyonu - Part 1

## Base URL

```
http://localhost:3000/api
```

**Not:** Ödev gereksinimlerinde `/api/v1/` formatı istenmiş, ancak mevcut implementasyonda `/api/` kullanılmıştır. API versioning için gelecekte `/api/v1/` alt yapısına geçiş yapılabilir.

---

## Authentication

Tüm korumalı endpoint'ler için `Authorization` header'ında JWT token gönderilmelidir:

```
Authorization: Bearer <access_token>
```

---

## Authentication Endpoints

### 1. POST /api/auth/register

Yeni kullanıcı kaydı oluşturur.

**Access:** Public

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "firstName": "Ahmet",
  "lastName": "Yılmaz",
  "phone": "+905551234567",
  "role": "student",
  "departmentId": "550e8400-e29b-41d4-a716-446655440001",
  "enrollmentYear": 2024,
  "studentNumber": "BM240001" // optional
}
```

**Validation Rules:**
- `email`: Geçerli e-posta formatı
- `password`: Minimum 6 karakter (ödev gereksinimi: min 8, uppercase, number - güncellenecek)
- `firstName`: Boş olamaz
- `lastName`: Boş olamaz
- `role`: 'student', 'faculty', 'admin', 'staff' arasından biri
- `departmentId`: Mevcut bir bölüm ID'si (student ve faculty için zorunlu)

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email for verification.",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Ahmet",
    "lastName": "Yılmaz",
    "role": "student",
    "isEmailVerified": false,
    "isActive": true,
    "createdAt": "2024-12-01T00:00:00.000Z"
  }
}
```

**Error Response:** `400 Bad Request`
```json
{
  "success": false,
  "error": "Bu e-posta adresi ile zaten bir hesap mevcut"
}
```

---

### 2. GET /api/auth/verify-email

E-posta adresini doğrular.

**Access:** Public

**Query Parameters:**
- `token` (required): E-posta doğrulama token'ı

**Request:**
```
GET /api/auth/verify-email?token=<verification_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "isEmailVerified": true
  }
}
```

**Error Response:** `400 Bad Request`
```json
{
  "success": false,
  "error": "Verification token is required"
}
```

**Error Response:** `400 Bad Request` (Invalid/Expired token)
```json
{
  "success": false,
  "error": "Invalid or expired verification token"
}
```

---

### 3. POST /api/auth/login

Kullanıcı girişi yapar.

**Access:** Public

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Validation Rules:**
- `email`: Geçerli e-posta formatı
- `password`: Boş olamaz

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "Ahmet",
      "lastName": "Yılmaz",
      "role": "student",
      "profilePicture": null,
      "studentProfile": {
        "studentNumber": "BM240001",
        "gpa": 3.50
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Token Expiry:**
- Access Token: 15 dakika
- Refresh Token: 7 gün

**Error Response:** `401 Unauthorized`
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

**Error Response:** `401 Unauthorized` (Inactive user)
```json
{
  "success": false,
  "error": "Account is not active"
}
```

---

### 4. POST /api/auth/refresh-token

Access token'ı yeniler.

**Access:** Public

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response:** `400 Bad Request`
```json
{
  "success": false,
  "error": "Refresh token is required"
}
```

**Error Response:** `401 Unauthorized`
```json
{
  "success": false,
  "error": "Invalid refresh token"
}
```

---

### 5. POST /api/auth/logout

Kullanıcı çıkışı yapar.

**Access:** Private (Requires Authentication)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Not:** Ödev gereksinimine göre `204 No Content` dönmeli, şu an `200 OK` dönüyor (güncellenecek).

**Error Response:** `401 Unauthorized`
```json
{
  "success": false,
  "error": "Invalid token"
}
```

---

### 6. POST /api/auth/forgot-password

Şifre sıfırlama e-postası gönderir.

**Access:** Public

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Validation Rules:**
- `email`: Geçerli e-posta formatı

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "If email exists, password reset link has been sent"
}
```

**Note:** Güvenlik nedeniyle, e-posta mevcut olmasa bile aynı mesaj döner.

---

### 7. POST /api/auth/reset-password

Şifreyi sıfırlar.

**Access:** Public

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "password": "NewPassword123"
}
```

**Validation Rules:**
- `token`: Boş olamaz
- `password`: Minimum 6 karakter (ödev gereksinimi: min 8, uppercase, number - güncellenecek)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Error Response:** `400 Bad Request`
```json
{
  "success": false,
  "error": "Invalid or expired reset token"
}
```

---

### 8. GET /api/auth/profile

Kullanıcı profil bilgilerini getirir.

**Access:** Private (Requires Authentication)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Ahmet",
    "lastName": "Yılmaz",
    "phone": "+905551234567",
    "role": "student",
    "profilePicture": "/uploads/profile-pictures/image.jpg",
    "isEmailVerified": true,
    "isActive": true,
    "createdAt": "2024-12-01T00:00:00.000Z",
    "studentProfile": {
      "studentNumber": "BM240001",
      "departmentId": "uuid",
      "enrollmentYear": 2024,
      "gpa": 3.50,
      "isScholarship": true,
      "walletBalance": 1500.00
    }
  }
}
```

**Error Response:** `401 Unauthorized`
```json
{
  "success": false,
  "error": "Invalid token"
}
```

---

## User Management Endpoints

### 9. PUT /api/auth/profile

Kullanıcı profil bilgilerini günceller.

**Access:** Private (Requires Authentication)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "firstName": "Mehmet",
  "lastName": "Demir",
  "phone": "+905559876543"
}
```

**Validation Rules:**
- `firstName`: Boş olamaz (optional, ama gönderilirse boş olamaz)
- `lastName`: Boş olamaz (optional, ama gönderilirse boş olamaz)
- `phone`: İsteğe bağlı

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Mehmet",
    "lastName": "Demir",
    "phone": "+905559876543",
    "role": "student"
  }
}
```

**Error Response:** `400 Bad Request`
```json
{
  "success": false,
  "error": "Validation error message"
}
```

---

### 10. POST /api/auth/profile/picture

Profil fotoğrafı yükler.

**Access:** Private (Requires Authentication)

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body:**
- `picture` (file, required): JPG veya PNG formatında, maksimum 5MB

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "data": {
    "profilePicture": "/uploads/profile-pictures/1234567890-image.jpg"
  }
}
```

**Error Response:** `400 Bad Request`
```json
{
  "success": false,
  "error": "Please upload a picture"
}
```

**Error Response:** `400 Bad Request` (File size/type)
```json
{
  "success": false,
  "error": "File too large or invalid format"
}
```

---

### 11. GET /api/users

Kullanıcı listesini getirir (Admin only).

**Access:** Private (Requires Admin Role)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (optional): Sayfa numarası (default: 1)
- `limit` (optional): Sayfa başına kayıt sayısı (default: 10)
- `role` (optional): Rol filtresi (student, faculty, admin, staff)
- `departmentId` (optional): Bölüm ID filtresi
- `search` (optional): İsim veya e-posta araması

**Request:**
```
GET /api/users?page=1&limit=10&role=student&search=ahmet
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "student1@example.com",
        "firstName": "Ahmet",
        "lastName": "Yılmaz",
        "role": "student",
        "isEmailVerified": true,
        "createdAt": "2024-12-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 50,
      "limit": 10
    }
  }
}
```

**Error Response:** `403 Forbidden` (Not Admin)
```json
{
  "success": false,
  "error": "Access denied. Admin role required."
}
```

**Not:** Bu endpoint henüz implement edilmemiş, eklenmesi gerekiyor.

---

## Department Endpoints

### 12. GET /api/departments

Tüm aktif bölümleri listeler.

**Access:** Public

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Bilgisayar Mühendisliği",
      "code": "BM",
      "description": "Bilgisayar Mühendisliği Bölümü"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Elektrik-Elektronik Mühendisliği",
      "code": "EE",
      "description": "Elektrik-Elektronik Mühendisliği Bölümü"
    }
  ]
}
```

---

### 13. GET /api/departments/:id

Belirli bir bölümün detaylarını getirir.

**Access:** Public

**Path Parameters:**
- `id` (required): Bölüm UUID'si

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Bilgisayar Mühendisliği",
    "code": "BM",
    "description": "Bilgisayar Mühendisliği Bölümü",
    "isActive": true,
    "createdAt": "2024-12-01T00:00:00.000Z"
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "success": false,
  "error": "Department not found"
}
```

**Not:** Bu endpoint henüz implement edilmemiş, eklenmesi gerekiyor.

---

## Error Codes

| Status Code | Açıklama |
|-------------|----------|
| `200` | Başarılı istek |
| `201` | Kayıt oluşturuldu |
| `204` | Başarılı (içerik yok) |
| `400` | Hatalı istek (validation error) |
| `401` | Yetkisiz (authentication required) |
| `403` | Erişim reddedildi (authorization required) |
| `404` | Kaynak bulunamadı |
| `500` | Sunucu hatası |

---

## Response Format

Tüm API yanıtları aşağıdaki formatı kullanır:

### Success Response
```json
{
  "success": true,
  "message": "Optional success message",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "stack": "Error stack (sadece development ortamında)"
}
```

---

## Rate Limiting

Şu anda rate limiting implement edilmemiştir. Production ortamında eklenmesi önerilir.

---

## Notlar

1. **API Versioning:** Mevcut implementasyonda `/api/` prefix kullanılıyor, ödev gereksiniminde `/api/v1/` istenmiş. Gelecek güncellemede versioning eklenebilir.

2. **Password Validation:** Şu anda minimum 6 karakter kontrolü var, ödev gereksinimi minimum 8 karakter + uppercase + number. Güçlendirilmesi gerekiyor.

3. **Logout Response:** Şu anda `200 OK` dönüyor, ödev gereksiniminde `204 No Content` istenmiş. Güncellenecek.

4. **Admin User List:** GET /api/users endpoint'i henüz implement edilmemiş, eklenmesi gerekiyor.

---

**Son Güncelleme:** Aralık 2024

