# IoT Yangın Tespit Sistemi Backend

ESP32 tabanlı gaz algılama güvenlik sistemi için Node.js/Express backend API.

## Özellikler

### Kimlik Doğrulama
- ✅ Kullanıcı kaydı (email, şifre, adres)
- ✅ Email doğrulama (OTP ile)
- ✅ Giriş/Çıkış
- ✅ Şifremi unuttum (OTP ile)
- ✅ JWT token + refresh token
- ✅ Şifre hashleme (bcrypt)
- ✅ Rate limiting

### Kullanıcı Özellikleri
- ✅ Profil yönetimi
- ✅ Geçmiş verileri görüntüleme
- ✅ Cihaz durumları
- ✅ İstatistikler
- ✅ Arıza bildirimi

### Admin Özellikleri
- ✅ Tüm kullanıcıları görüntüleme
- ✅ Kullanıcı detayları ve adresleri
- ✅ Arıza bildirimlerini yönetme
- ✅ Sistem istatistikleri
- ✅ Kullanıcı silme/rol değiştirme

### ESP32 Entegrasyonu
- ✅ MQ4 gaz sensörü verisi alma
- ✅ Gaz seviyesi analizi (PPM)
- ✅ RFID kart okuma (sistem başlat/durdur)
- ✅ Buzzer kontrolü (alarm)
- ✅ Otomatik cihaz offline tespiti

### Email Bildirimleri
- ✅ OTP kodları
- ✅ Sistem başlatıldı
- ✅ Sistem durduruldu (günlük PDF rapor ile)
- ✅ Cihaz gücü kesildi
- ✅ Gaz algılandı (tehlike/uyarı uyarısı)
- ✅ Arıza bildirimi (admin'e)

### Güvenlik
- ✅ JWT authentication
- ✅ Bcrypt password hashing
- ✅ Rate limiting
- ✅ Input validation
- ✅ Helmet.js
- ✅ CORS

## Kurulum

```bash
cd backend
npm install
```

## Çalıştırma

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Auth (`/api/auth`)
- `POST /register` - Kayıt ol
- `POST /verify-email` - Email doğrula
- `POST /login` - Giriş yap
- `POST /logout` - Çıkış yap
- `POST /forgot-password` - Şifremi unuttum
- `POST /reset-password` - Şifre sıfırla
- `POST /resend-otp` - OTP yeniden gönder
- `POST /refresh-token` - Token yenile

### User (`/api/user`)
- `GET /profile` - Profil bilgileri
- `PUT /profile` - Profil güncelle
- `PUT /pet-mode` - Evcil hayvan modu aç/kapa
- `GET /devices` - Cihazları listele
- `GET /sensor-data` - Geçmiş verileri getir
- `GET /stats` - İstatistikler
- `POST /fault-report` - Arıza bildir
- `GET /fault-reports` - Arıza bildirimlerimi getir

### Admin (`/api/admin`)
- `GET /users` - Tüm kullanıcılar
- `GET /users/:id` - Kullanıcı detayı
- `DELETE /users/:id` - Kullanıcı sil
- `PUT /users/:id/role` - Rol değiştir
- `GET /fault-reports` - Tüm arıza bildirimleri
- `PUT /fault-reports/:id` - Arıza güncelle
- `GET /stats` - Sistem istatistikleri

### Device (`/api/device`)
- `POST /update` - ESP32'den veri al (public)
- `POST /rfid` - RFID kart okuma (public)
- `POST /register` - Cihaz kaydet (protected)

## Çevre Değişkenleri

`.env` dosyası oluşturun ve aşağıdaki değişkenleri ekleyin:

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# MongoDB
# MongoDB Atlas URI'nizi buraya girin
# Örnek: mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/iot_security?retryWrites=true&w=majority
MONGO_URI=your_mongodb_uri_here

# JWT Token
# Güvenli ve rastgele bir string kullanın (en az 32 karakter önerilir)
JWT_SECRET_KEY=your_jwt_secret_key_here
JWT_EXPIRE=10d
JWT_REFRESH_SECRET_KEY=your_jwt_refresh_secret_key_here
JWT_REFRESH_EXPIRE=1d

# Cookie
JWT_COOKIE=1000000

# Temp Token Expire (milisaniye cinsinden)
TEMP_TOKEN_EXPIRE=36000000

# NodeMailer (Gmail SMTP)
# Gmail hesabınızın bilgilerini girin
# Not: Gmail'de 2FA aktif olmalı ve uygulama şifresi oluşturmalısınız
# Uygulama şifresi oluşturma: https://myaccount.google.com/apppasswords
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_ADMIN=your_email@gmail.com
SMTP_PASS=your_gmail_app_password_here

# Rate Limiting
# 15 dakikada maksimum 100 istek
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# OTP (One-Time Password)
# OTP kodunun geçerlilik süresi (dakika cinsinden)
OTP_EXPIRE_MINUTES=10
```

**Kurulum Adımları:**

1. **`.env.example` dosyasını kopyalayın:**
   ```bash
   cp .env.example .env
   ```

2. **MongoDB Atlas URI:**
   - MongoDB Atlas'a giriş yapın: https://cloud.mongodb.com
   - Cluster oluşturun
   - "Connect" → "Connect your application" seçin
   - Connection string'i kopyalayın
   - `MONGO_URI` değişkenine yapıştırın

3. **JWT Secret Keys:**
   - Güvenli rastgele string'ler oluşturun
   - Online generator: https://randomkeygen.com
   - Veya terminal: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

4. **Gmail SMTP:**
   - Gmail hesabınızda 2FA'yı aktif edin
   - https://myaccount.google.com/apppasswords adresine gidin
   - "Mail" seçin ve uygulama şifresi oluşturun
   - 16 haneli şifreyi `SMTP_PASS` değişkenine yazın
   - Gmail adresinizi `SMTP_ADMIN` değişkenine yazın

5. **Diğer Değişkenler:**
   - `PORT`: Backend sunucu portu (varsayılan: 4000)
   - `NODE_ENV`: development veya production
   - `OTP_EXPIRE_MINUTES`: OTP kodunun geçerlilik süresi (varsayılan: 10 dakika)

## Gaz Algılama

Sistem MQ4 sensöründen gelen PPM değerlerine göre gaz seviyesini analiz eder:

**Gaz Seviyeleri:**
- **Güvenli:** 0-999 PPM (Buzzer kapalı)
- **Uyarı:** 1000-2999 PPM (Buzzer aktif, email gönderilir)
- **Tehlike:** 3000+ PPM (Buzzer aktif, acil email gönderilir)

**Buzzer Kontrolü:**
- Gaz algılandığında her iki cihazın buzzer'ı da aktif olur
- 500ms açık, 500ms kapalı şeklinde tekrarlı çalışır
- Sistem durdurulduğunda otomatik kapanır

## WebSocket Events

- `gas_update` - Yeni gaz sensörü verisi
- `device_status` - Cihaz durumu değişti
- `system_status` - Sistem başlatıldı/durduruldu

## Teknolojiler

- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Socket.IO
- Nodemailer
- PDFKit
- Bcrypt
- Express Validator
- Rate Limiting
