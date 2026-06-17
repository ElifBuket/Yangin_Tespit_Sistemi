<<<<<<< HEAD
# 🏠 IoT Yangın Tespit Sistemi

ESP32 tabanlı, RFID kontrollü, MQ2 gaz sensörlü, gerçek zamanlı izleme ve email bildirimleri içeren tam kapsamlı bir IoT güvenlik sistemi.

## 📋 İçindekiler
- [Sistem Mimarisi](#sistem-mimarisi)
- [Teknik Özellikler](#teknik-özellikler)
- [Donanım Bileşenleri](#donanım-bileşenleri)
- [Yazılım Mimarisi](#yazılım-mimarisi)
- [Kurulum](#kurulum)
- [API Dokümantasyonu](#api-dokümantasyonu)
- [Güvenlik](#güvenlik)

---

## 🎯 Sistem Mimarisi

### Genel Bakış
```
┌─────────────────────────────────────────────────────────────┐
│                    IoT Gaz Algılama Sistemi                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │  ESP32 #1    │         │  ESP32 #2    │                  │
│  │  (RFID)      │         │  (ENV)       │                  │
│  │              │         │              │                  │
│  │ • MQ2 Sensör │         │ • MQ2 Sensör │                  │
│  │ • Buzzer     │         │ • Buzzer     │                  │
│  │ • RFID RC522 │         │              │                  │
│  └──────┬───────┘         └──────┬───────┘                  │
│         │                        │                           │
│         │   WiFi (HTTP/JSON)     │                           │
│         └────────┬───────────────┘                           │
│                  │                                            │
│         ┌────────▼────────┐                                  │
│         │  Backend Server │                                  │
│         │  Node.js/Express│                                  │
│         │                 │                                  │
│         │ • REST API      │                                  │
│         │ • WebSocket     │                                  │
│         │ • MongoDB       │                                  │
│         │ • Email Service │                                  │
│         └────────┬────────┘                                  │
│                  │                                            │
│         ┌────────▼────────┐                                  │
│         │   Frontend      │                                  │
│         │   React + Vite  │                                  │
│         │                 │                                  │
│         │ • Dashboard     │                                  │
│         │ • Real-time     │                                  │
│         │ • Analytics     │                                  │
│         └─────────────────┘                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Teknik Özellikler

### Backend (Node.js/Express)

#### Teknoloji Stack
- **Runtime:** Node.js v16+
- **Framework:** Express.js v4.18
- **Database:** MongoDB Atlas (Cloud) / Local MongoDB
- **ODM:** Mongoose v7.5
- **Authentication:** JWT (JSON Web Tokens)
- **Real-time:** Socket.IO v4.7
- **Email:** Nodemailer v6.9
- **PDF Generation:** PDFKit v0.13
- **Security:** Helmet.js, Bcrypt (12 rounds)
- **Rate Limiting:** Express-rate-limit

#### API Endpoints

**Authentication & Authorization**
```javascript
POST   /api/auth/register          // Kullanıcı kaydı
POST   /api/auth/verify-email      // Email doğrulama (OTP)
POST   /api/auth/login             // JWT token ile giriş
POST   /api/auth/logout            // Token invalidation
POST   /api/auth/forgot-password   // Şifre sıfırlama isteği
POST   /api/auth/reset-password    // Şifre sıfırlama (OTP)
POST   /api/auth/refresh-token     // Token yenileme
```

**User Operations**
```javascript
GET    /api/user/profile           // Kullanıcı profili
PUT    /api/user/profile           // Profil güncelleme
GET    /api/user/devices           // Cihaz listesi
GET    /api/user/sensor-data       // Geçmiş veriler (filtreleme)
GET    /api/user/stats             // İstatistikler (24h/7d/30d)
POST   /api/user/fault-report      // Arıza bildirimi
```

**Device Operations (ESP32)**
```javascript
POST   /api/device/update          // Gaz verisi gönderme (Public)
POST   /api/device/rfid            // RFID kart okuma (Public)
GET    /api/device/mute-buzzer     // Buzzer susturma (Email link)
POST   /api/device/register        // Cihaz kaydı (Protected)
```

**Admin Operations**
```javascript
GET    /api/admin/users            // Tüm kullanıcılar
GET    /api/admin/users/:id        // Kullanıcı detayı
DELETE /api/admin/users/:id        // Kullanıcı silme
PUT    /api/admin/users/:id/role   // Rol değiştirme
GET    /api/admin/fault-reports    // Arıza bildirimleri
PUT    /api/admin/fault-reports/:id // Arıza güncelleme
```

#### Database Schema

**User Collection**
```javascript
{
  name: String,
  email: String (unique, indexed),
  password: String (bcrypt hashed),
  address: {
    street: String,
    city: String,
    zipCode: String,
    country: String
  },
  role: Enum['user', 'admin'],
  isEmailVerified: Boolean,
  devices: [ObjectId],
  otp: {
    code: String,
    expiresAt: Date,
    purpose: Enum['email_verification', 'password_reset']
  },
  refreshToken: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Device Collection**
```javascript
{
  deviceId: String (unique, enum['esp32_rfid', 'esp32_env']),
  owner: ObjectId (ref: User),
  name: String,
  type: Enum['RFID', 'ENV'],
  status: Enum['online', 'offline', 'error'],
  systemStatus: Enum['started', 'stopped'],
  buzzerActive: Boolean,
  lastSeen: Date,
  lastStartTime: Date,
  lastStopTime: Date,
  lastGasAlert: Date,
  masterCardUID: String
}
```

**SensorData Collection**
```javascript
{
  deviceId: String (indexed),
  user: ObjectId (ref: User, indexed),
  gasValue: Number,        // Analog değer (0-4095)
  gasPPM: Number,          // PPM cinsinden
  gasDetected: Boolean,
  gasLevel: Enum['safe', 'warning', 'danger'],
  scannerIp: String,
  timestamp: Date (indexed, TTL: 30 days)
}
```

#### Gaz Algılama Algoritması

**Threshold Değerleri**
```javascript
const GAS_THRESHOLDS = {
  WARNING: 1000,  // PPM
  DANGER: 3000    // PPM
};

function analyzeGasLevel(gasPPM) {
  if (gasPPM >= 3000) return 'danger';
  if (gasPPM >= 1000) return 'warning';
  return 'safe';
}
```

**Buzzer Senkronizasyonu**
```javascript
// Herhangi bir cihazda gaz algılanırsa
// TÜM cihazların buzzer'ı aktif olur
if (gasDetected) {
  await Device.updateMany(
    { owner: userId },
    { buzzerActive: true }
  );
}
```

**Spam Önleme**
- Email: 5 dakikada bir (kullanıcı bazında)
- Cihaz offline: 10 dakikada bir
- Rate limiting: 100 req/15 dakika

---

### Frontend (React + Vite)

#### Teknoloji Stack
- **Framework:** React 18.2
- **Build Tool:** Vite 5.0
- **Routing:** React Router v6
- **State Management:** Zustand 4.4
- **HTTP Client:** Axios 1.6
- **Real-time:** Socket.IO Client 4.7
- **Charts:** Recharts 2.10
- **Styling:** Tailwind CSS 3.3
- **Icons:** Lucide React 0.294
- **Notifications:** React Hot Toast 2.4
- **Date Handling:** date-fns 2.30

#### Component Yapısı
```
src/
├── components/
│   ├── Layout.jsx           // Ana layout wrapper
│   ├── PrivateRoute.jsx     // Auth guard
│   └── AdminRoute.jsx       // Admin guard
├── pages/
│   ├── Dashboard.jsx        // Ana dashboard (gaz izleme)
│   ├── History.jsx          // Geçmiş veriler
│   ├── Devices.jsx          // Cihaz yönetimi
│   ├── Profile.jsx          // Kullanıcı profili
│   ├── FaultReports.jsx     // Arıza bildirimleri
│   └── admin/
│       ├── AdminDashboard.jsx
│       └── UserManagement.jsx
├── store/
│   └── authStore.js         // Zustand store
├── utils/
│   ├── api.js               // Axios instance
│   └── socket.js            // Socket.IO client
└── App.jsx
```

#### WebSocket Events

**Client → Server**
```javascript
// Bağlantı kuruldu
socket.on('connect', () => {
  console.log('Connected:', socket.id);
});
```

**Server → Client**
```javascript
// Gaz verisi güncellendi
socket.on('gas_update', (data) => {
  // { deviceId, gasPPM, gasLevel, gasDetected, buzzerActive, timestamp }
});

// Sistem durumu değişti
socket.on('system_status', (data) => {
  // { deviceId, status: 'started'|'stopped', buzzerActive }
});

// Cihaz durumu değişti
socket.on('device_status', (data) => {
  // { deviceId, status: 'online'|'offline' }
});

// Buzzer susturuldu
socket.on('buzzer_muted', (data) => {
  // { userId, timestamp }
});
```

---

### ESP32 Firmware

#### Pin Konfigürasyonu

**ESP32 #1 (RFID Cihazı)**
```cpp
// MQ4 Gaz Sensörü
#define MQ4_PIN 34        // ADC1_CH6 (Analog)

// Buzzer (Aktif)
#define BUZZER_PIN 25     // GPIO 25 (PWM capable)

// MFRC522 RFID
#define RST_PIN 22        // GPIO 22
#define SS_PIN 5          // GPIO 5 (SPI CS)
// MOSI → GPIO 23
// MISO → GPIO 19
// SCK  → GPIO 18
```

**ESP32 #2 (ENV Cihazı)**
```cpp
// MQ4 Gaz Sensörü
#define MQ4_PIN 34        // ADC1_CH6 (Analog)

// Buzzer (Aktif)
#define BUZZER_PIN 25     // GPIO 25
```

#### Veri İletişimi

**HTTP POST Request (JSON)**
```cpp
POST /api/device/update
Content-Type: application/json

{
  "device_id": "esp32_rfid",
  "gas_value": 2048,        // Analog (0-4095)
  "gas_ppm": 1500.5,        // Hesaplanmış PPM
  "scanner_ip": "192.168.1.101",
  "timestamp_ms": 123456789
}
```

**Backend Response**
```json
{
  "status": "ok",
  "buzzer_active": true,
  "sample_interval_ms": 5000
}
```

#### MQ4 Sensör Kalibrasyonu

**Analog → PPM Dönüşümü**
```cpp
int gasValue = analogRead(MQ4_PIN);  // 0-4095
float gasPPM = map(gasValue, 0, 4095, 0, 10000);

// Kalibrasyon formülü (sensöre göre ayarlanmalı)
// Rs/R0 = [(VC/VRL) - 1] / RL
// PPM = a * (Rs/R0)^b
```

**Isınma Süresi**
- İlk kullanım: 24-48 saat
- Her açılışta: 3-5 dakika

#### Buzzer Kontrolü

**PWM Frekansı**
```cpp
const unsigned long BUZZER_DURATION = 500;  // ms açık
const unsigned long BUZZER_PAUSE = 500;     // ms kapalı
// Frekans: 1 Hz (500ms on/off)
```

---

## 🔐 Güvenlik Özellikleri

### Authentication & Authorization

**JWT Token Yapısı**
```javascript
// Access Token (10 gün)
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "role": "user",
  "iat": 1234567890,
  "exp": 1235431890
}

// Refresh Token (1 gün)
{
  "userId": "507f1f77bcf86cd799439011",
  "type": "refresh",
  "iat": 1234567890,
  "exp": 1234654290
}
```

**Password Hashing**
```javascript
// Bcrypt with 12 rounds
const salt = await bcrypt.genSalt(12);
const hashedPassword = await bcrypt.hash(password, salt);
// Örnek: $2b$12$KIXxLVq8ZG5aR3zN7yH8ue...
```

**OTP Generation**
```javascript
// 6 haneli rastgele kod
const otp = Math.floor(100000 + Math.random() * 900000);
// Geçerlilik: 10 dakika
```

### Rate Limiting

**Genel API**
```javascript
windowMs: 15 * 60 * 1000,  // 15 dakika
max: 100                    // 100 istek
```

**ESP32 Endpoints**
```javascript
windowMs: 1 * 60 * 1000,   // 1 dakika
max: 20                     // 20 istek
```

### Input Validation

**Express Validator**
```javascript
body('email').isEmail().normalizeEmail(),
body('password').isLength({ min: 6 }),
body('gasPPM').isFloat({ min: 0, max: 10000 })
```

### CORS Policy

**Allowed Origins**
```javascript
[
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
]
```

---

## 📧 Email Sistemi

### SMTP Konfigürasyonu

**Gmail SMTP**
```javascript
{
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,  // STARTTLS
  auth: {
    user: process.env.SMTP_ADMIN,
    pass: process.env.SMTP_PASS  // App Password
  }
}
```

### Email Şablonları

**1. OTP Email**
- Konu: "📧 Email Doğrulama Kodu"
- İçerik: 6 haneli kod + 10 dakika geçerlilik

**2. Sistem Başlatıldı**
- Konu: "✅ Güvenlik Sistemi Başlatıldı"
- İçerik: Zaman, cihaz ID, durum

**3. Sistem Durduruldu**
- Konu: "🔴 Güvenlik Sistemi Durduruldu - Günlük Rapor"
- İçerik: Özet + PDF rapor eki

**4. Gaz Algılandı**
- Konu: "🚨 UYARI/TEHLİKE: Gaz Algılandı!"
- İçerik: PPM değeri, seviye, **"Buzzer'ı Sustur" butonu**

**5. Cihaz Offline**
- Konu: "⚠️ UYARI: Cihaz Gücü Kesildi"
- İçerik: Cihaz ID, son görülme zamanı

**6. Arıza Bildirimi (Admin)**
- Konu: "🔧 Yeni Arıza Bildirimi"
- İçerik: Kullanıcı bilgileri, arıza detayları

### PDF Rapor Oluşturma

**PDFKit ile Günlük Rapor**
```javascript
- Başlık ve tarih
- Kullanıcı bilgileri
- Cihaz bilgileri
- İstatistikler (ortalama, max, min PPM)
- Gaz algılama sayısı
- Son 10 ölçüm tablosu
- Footer (otomatik oluşturulma notu)
```

---

## 📊 Performans ve Optimizasyon

### Database Indexing
```javascript
// User collection
email: { type: String, unique: true, index: true }

// SensorData collection
deviceId: { type: String, index: true }
user: { type: ObjectId, index: true }
timestamp: { type: Date, index: true }

// TTL Index (30 gün sonra otomatik silme)
timestamp: { expireAfterSeconds: 2592000 }
```

### Caching Strategy
- Device status: Memory cache (Map)
- Last alert timestamps: Memory cache
- User sessions: JWT (stateless)

### WebSocket Optimization
- Event-based updates (polling yok)
- Selective broadcasting (room-based)
- Automatic reconnection

---

## 🚀 Kurulum

### Gereksinimler
- Node.js v16+
- MongoDB 4.4+
- Arduino IDE 1.8+
- ESP32 Board Package
- Gmail hesabı (2FA + App Password)

### Backend Kurulumu
```bash
cd backend
npm install
cp .env.example .env
# .env dosyasını düzenle
npm run dev
```

### Frontend Kurulumu
```bash
cd frontend
npm install
cp .env.example .env
# .env dosyasını düzenle
npm run dev
```

### ESP32 Kurulumu
1. Arduino IDE'de ESP32 board package yükle
2. Kütüphaneleri yükle: ArduinoJson, MFRC522
3. WiFi ve server bilgilerini düzenle
4. Upload

**Detaylı kurulum:** `KURULUM_REHBERI.md`

---

## 📚 Dokümantasyon

- **README.md** - Bu dosya (genel bakış)
- **KURULUM_REHBERI.md** - Adım adım kurulum
- **PROJE_OZETI.md** - Teknik detaylar ve mimari
- **backend/README.md** - Backend API dokümantasyonu
- **frontend/README.md** - Frontend dokümantasyonu

---

## 🧪 Test

### Backend Test
```bash
npm test
```

### API Test (Postman)
```bash
# Postman collection import et
backend/postman_collection.json
```

### ESP32 Test
```cpp
// Serial Monitor (115200 baud)
// Bağlantı logları
// Gaz değerleri
// HTTP response kodları
```

---

## 🔧 Troubleshooting

### ESP32 WiFi Bağlanamıyor
- SSID/Password doğru mu?
- 2.4GHz WiFi mi? (5GHz desteklenmiyor)
- Router MAC filtrelemesi var mı?

### Backend'e Veri Gönderilemiyor
- Backend çalışıyor mu?
- IP adresi doğru mu?
- Firewall port 4000'i engelliyor mu?

### Buzzer Çalışmıyor
- Aktif buzzer mi? (3 bacaklı)
- GPIO 25 doğru bağlı mı?
- Buzzer polaritesi doğru mu?

### Email Gelmiyor
- Gmail App Password doğru mu?
- 2FA aktif mi?
- Spam klasörünü kontrol et
- SMTP_HOST ve PORT doğru mu?

---

## 📈 Gelecek Geliştirmeler

- [ ] Mobil uygulama (React Native)
- [ ] SMS bildirimleri (Twilio)
- [ ] Grafik trend analizi (ML)
- [ ] Çoklu kullanıcı desteği (aile üyeleri)
- [ ] Sesli uyarı (Text-to-Speech)
- [ ] Akıllı ev entegrasyonu (Google Home, Alexa)
- [ ] HTTPS desteği (SSL/TLS)
- [ ] Docker containerization
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Unit & Integration tests
- [ ] Prometheus + Grafana monitoring

---

## 📄 Lisans

MIT License

---

## 👨‍💻 Geliştirici

**Proje:** IoT Gaz Algılama Güvenlik Sistemi  
**Versiyon:** 1.0.0  
**Tarih:** 2024

---

## 🆘 Destek

Sorun yaşıyorsanız:
1. `KURULUM_REHBERI.md` dosyasını kontrol edin
2. Serial Monitor loglarını inceleyin
3. Backend console loglarını kontrol edin
4. GitHub Issues'da sorun açın

---

## ⚠️ Güvenlik Uyarısı

Bu sistem **eğitim amaçlıdır**. Kritik güvenlik uygulamaları için:
- Sertifikalı ekipman kullanın
- Profesyonel kurulum yaptırın
- Düzenli bakım yapın
- Acil durum planı oluşturun

**Gaz algılandığında:**
1. Hemen havalandırın
2. Elektrik anahtarlarına dokunmayın
3. Gaz kaynağını kapatın
4. Gerekirse 112'yi arayın

---

**🎉 Başarılar dileriz!**
=======
# Yangin_Tespit_Sistemi
>>>>>>> 4262544ef408927cbc735251be7ff517036a7692
