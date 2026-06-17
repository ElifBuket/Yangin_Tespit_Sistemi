# 🎯 IoT Gaz Algılama Sistemi - Proje Özeti

## 📊 Sistem Mimarisi

```
┌─────────────────┐         ┌─────────────────┐
│   ESP32 #1      │         │   ESP32 #2      │
│   (RFID)        │         │   (ENV)         │
│                 │         │                 │
│ • MQ4 Sensör    │         │ • MQ4 Sensör    │
│ • Buzzer        │         │ • Buzzer        │
│ • RFID Okuyucu  │         │                 │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │    WiFi (HTTP POST)       │
         └───────────┬───────────────┘
                     │
         ┌───────────▼────────────┐
         │   Backend Server       │
         │   (Node.js/Express)    │
         │                        │
         │ • MongoDB              │
         │ • Socket.IO            │
         │ • Email Service        │
         │ • PDF Generator        │
         └───────────┬────────────┘
                     │
         ┌───────────▼────────────┐
         │   Frontend             │
         │   (React + Vite)       │
         │                        │
         │ • Dashboard            │
         │ • Canlı Veri           │
         │ • Geçmiş Veriler       │
         └────────────────────────┘
```

---

## 🔄 Sistem Akışı

### 1. Başlatma
```
RFID Kart Okut → Backend'e POST → Sistem "started" → Email Gönder
```

### 2. İzleme (Her 5 saniye)
```
MQ4 Ölç → PPM Hesapla → Backend'e POST → Analiz Et → 
  ├─ Güvenli (0-999 PPM) → Buzzer Kapalı
  ├─ Uyarı (1000-2999 PPM) → Buzzer Aktif + Email
  └─ Tehlike (3000+ PPM) → Buzzer Aktif + Acil Email
```

### 3. Durdurma
```
RFID Kart Okut → Backend'e POST → Sistem "stopped" → 
  Buzzer Kapat → PDF Rapor Oluştur → Email Gönder
```

---

## 📁 Dosya Yapısı

```
project/
├── ESP32_gas_sensor_rfid.ino      # ESP32 RFID + MQ4 + Buzzer
├── ESP32_gas_sensor_env.ino       # ESP32 MQ4 + Buzzer
├── README.md                       # Ana README
├── KURULUM_REHBERI.md             # Detaylı kurulum
├── PROJE_OZETI.md                 # Bu dosya
│
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB bağlantısı
│   ├── controllers/
│   │   ├── authController.js      # Kimlik doğrulama
│   │   ├── userController.js      # Kullanıcı işlemleri
│   │   ├── adminController.js     # Admin işlemleri
│   │   └── deviceController.js    # Cihaz ve gaz algılama
│   ├── middleware/
│   │   ├── auth.js                # JWT doğrulama
│   │   ├── rateLimiter.js         # Rate limiting
│   │   └── validation.js          # Input validation
│   ├── models/
│   │   ├── User.js                # Kullanıcı modeli
│   │   ├── Device.js              # Cihaz modeli
│   │   ├── SensorData.js          # Gaz verisi modeli
│   │   └── FaultReport.js         # Arıza bildirimi
│   ├── routes/
│   │   ├── auth.js                # Auth route'ları
│   │   ├── user.js                # User route'ları
│   │   ├── admin.js               # Admin route'ları
│   │   └── device.js              # Device route'ları
│   ├── utils/
│   │   ├── gasDetector.js         # Gaz algılama mantığı ⭐
│   │   ├── emailService.js        # Email gönderimi
│   │   ├── pdfGenerator.js        # PDF rapor
│   │   └── otpService.js          # OTP oluşturma
│   ├── .env                       # Çevre değişkenleri
│   ├── server.js                  # Ana server
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Layout.jsx
    │   │   ├── PrivateRoute.jsx
    │   │   └── AdminRoute.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── GasDashboard.jsx   # Gaz dashboard ⭐
    │   │   ├── History.jsx
    │   │   └── Profile.jsx
    │   ├── store/
    │   │   └── authStore.js
    │   ├── utils/
    │   │   ├── api.js
    │   │   └── socket.js
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

---

## 🔑 Önemli Dosyalar ve Fonksiyonlar

### Backend

**`utils/gasDetector.js`** - Gaz Algılama Mantığı
```javascript
analyzeGasLevel(gasPPM) {
  // 0-999: safe
  // 1000-2999: warning
  // 3000+: danger
  return { level, detected, shouldAlert, buzzerActive }
}
```

**`controllers/deviceController.js`** - Ana Kontrol
```javascript
receiveData() {
  // ESP32'den veri al
  // Gaz seviyesini analiz et
  // Buzzer kontrolü
  // Email gönder (gerekirse)
  // Socket.IO ile frontend'e gönder
}

handleRFID() {
  // RFID kart okuma
  // Sistem başlat/durdur
  // Buzzer kontrolü
  // PDF rapor oluştur
}
```

**`utils/emailService.js`** - Email Servisi
```javascript
sendGasAlert(email, userName, gasData) {
  // Gaz uyarısı emaili
  // Tehlike/Uyarı seviyesine göre
}
```

### ESP32

**`ESP32_gas_sensor_rfid.ino`**
```cpp
void sendGasData() {
  // MQ4'ten analog değer oku
  // PPM'e çevir
  // Backend'e POST et
  // Buzzer komutunu al
}

void handleBuzzer() {
  // 500ms açık, 500ms kapalı
  // Tekrarlı çalışma
}
```

---

## 🔧 Yapılandırma

### Gaz Eşikleri (Backend)
```javascript
// backend/utils/gasDetector.js
const GAS_THRESHOLDS = {
  WARNING: 1000,  // PPM
  DANGER: 3000    // PPM
};
```

### Buzzer Ayarları (ESP32)
```cpp
// ESP32_gas_sensor_*.ino
const unsigned long BUZZER_DURATION = 500;  // ms açık
const unsigned long BUZZER_PAUSE = 500;     // ms kapalı
```

### Örnekleme Periyodu
```cpp
// ESP32_gas_sensor_*.ino
unsigned long sample_interval_ms = 5000;  // 5 saniye
```

---

## 📊 Veritabanı Şeması

### SensorData Collection
```javascript
{
  deviceId: String,        // "esp32_rfid" veya "esp32_env"
  user: ObjectId,          // Kullanıcı referansı
  gasValue: Number,        // Analog değer (0-4095)
  gasPPM: Number,          // PPM cinsinden
  gasDetected: Boolean,    // Gaz algılandı mı?
  gasLevel: String,        // "safe", "warning", "danger"
  scannerIp: String,       // ESP32 IP
  timestamp: Date
}
```

### Device Collection
```javascript
{
  deviceId: String,        // "esp32_rfid" veya "esp32_env"
  owner: ObjectId,         // Kullanıcı
  name: String,
  type: String,            // "RFID" veya "ENV"
  status: String,          // "online", "offline"
  systemStatus: String,    // "started", "stopped"
  buzzerActive: Boolean,   // Buzzer durumu
  lastGasAlert: Date,
  lastSeen: Date
}
```

---

## 🌐 API Endpoints

### Device (Public - ESP32'den)
```
POST /api/device/update
Body: { device_id, gas_value, gas_ppm, scanner_ip }
Response: { status, buzzer_active, sample_interval_ms }

POST /api/device/rfid
Body: { device_id, uid }
Response: { status, system_status, buzzer_active }

GET /api/device/mute-buzzer?userId=xxx
Response: HTML sayfası (Buzzer susturuldu)
```

### User (Protected)
```
GET  /api/user/devices          # Cihazları listele
GET  /api/user/sensor-data      # Geçmiş veriler
GET  /api/user/stats            # İstatistikler
POST /api/user/fault-report     # Arıza bildir
```

### Admin (Protected + Admin)
```
GET  /api/admin/users           # Tüm kullanıcılar
GET  /api/admin/fault-reports   # Arıza bildirimleri
```

---

## 🔌 WebSocket Events

### Backend → Frontend
```javascript
socket.emit('gas_update', {
  deviceId: 'esp32_rfid',
  gasPPM: 1500,
  gasLevel: 'warning',
  gasDetected: true,
  buzzerActive: true,
  timestamp: Date
});

socket.emit('system_status', {
  deviceId: 'esp32_rfid',
  status: 'started',
  buzzerActive: false
});

socket.emit('device_status', {
  deviceId: 'esp32_rfid',
  status: 'offline'
});
```

---

## 🎨 Frontend Bileşenleri

### GasDashboard.jsx
- Canlı gaz seviyesi gösterimi
- Cihaz durumları
- Buzzer durumu
- Uyarı mesajları
- Eşik bilgileri

---

## 🔐 Güvenlik

### Backend
- JWT token authentication
- Bcrypt password hashing (12 rounds)
- Rate limiting (100 req/15min)
- Input validation (express-validator)
- Helmet.js security headers
- CORS protection

### ESP32
- WiFi WPA2 encryption
- RFID kart UID kontrolü
- HTTPS kullanılabilir (opsiyonel)

---

## 📧 Email Şablonları

1. **OTP Kodu** - Email doğrulama, şifre sıfırlama
2. **Sistem Başlatıldı** - RFID kart okutuldu
3. **Sistem Durduruldu** - PDF rapor eki ile
4. **Gaz Algılandı** - Uyarı/Tehlike seviyesi
5. **Cihaz Offline** - Güç kesildi uyarısı
6. **Arıza Bildirimi** - Admin'e

---

## 🧪 Test Senaryoları

### 1. Normal Çalışma
```
1. RFID kart okut → Sistem başlar
2. Temiz hava → Buzzer kapalı
3. RFID kart okut → Sistem durur
4. Email gelir (PDF rapor ile)
```

### 2. Gaz Algılama
```
1. Sistem başlatılmış
2. Çakmak yaklaştır → PPM yükselir
3. 1000 PPM → Buzzer öter, email gelir
4. 3000 PPM → Acil email gelir
5. Havalandır → PPM düşer, buzzer durur
```

### 3. Cihaz Offline
```
1. Sistem çalışıyor
2. ESP32'nin fişini çek
3. 30 saniye bekle
4. Email gelir (cihaz offline)
```

---

## 📈 Performans

- **Örnekleme:** 5 saniyede bir
- **Email Spam Önleme:** 5 dakikada bir
- **Offline Tespiti:** 30 saniye
- **Buzzer Frekansı:** 1 Hz (500ms açık/kapalı)
- **WebSocket:** Gerçek zamanlı

---

## 🚀 Gelecek Geliştirmeler

- [ ] Mobil uygulama (React Native)
- [ ] SMS bildirimleri
- [ ] Grafik ve trend analizi
- [ ] Çoklu kullanıcı desteği (aile üyeleri)
- [ ] Sesli uyarı (TTS)
- [ ] Akıllı ev entegrasyonu (Google Home, Alexa)
- [ ] Makine öğrenmesi ile yanlış alarm azaltma

---

## 📞 İletişim ve Destek

- GitHub Issues
- Email: admin@example.com
- Arıza bildirimi sistemi

---

**Son Güncelleme:** 2024
**Versiyon:** 1.0.0
**Lisans:** MIT
