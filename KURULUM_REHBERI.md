# 📘 IoT Gaz Algılama Sistemi - Detaylı Kurulum Rehberi

## 📋 İçindekiler
1. [Gereksinimler](#gereksinimler)
2. [Donanım Kurulumu](#donanım-kurulumu)
3. [Backend Kurulumu](#backend-kurulumu)
4. [ESP32 Kurulumu](#esp32-kurulumu)
5. [Frontend Kurulumu](#frontend-kurulumu)
6. [Test ve Çalıştırma](#test-ve-çalıştırma)

---

## 🛠️ Gereksinimler

### Yazılım
- Node.js (v16 veya üzeri)
- MongoDB (Atlas veya local)
- Arduino IDE (ESP32 için)
- Git

### Donanım
- 2x ESP32 Development Board
- 2x MQ4 Gaz Sensörü
- 2x 3 Bacaklı Aktif Buzzer
- 1x MFRC522 RFID Okuyucu
- 1x RFID Kart
- Breadboard ve jumper kablolar
- USB kabloları

---

## 🔌 Donanım Kurulumu

### ESP32 #1 (RFID Cihazı)

**MQ4 Gaz Sensörü:**
```
MQ4 VCC  → ESP32 3.3V
MQ4 GND  → ESP32 GND
MQ4 AOUT → ESP32 GPIO 34 (Analog)
```

**Buzzer (3 Bacaklı Aktif):**
```
Buzzer + (Uzun bacak) → ESP32 GPIO 25
Buzzer - (Kısa bacak) → ESP32 GND
Buzzer S (Orta bacak) → Bağlanmaz
```

**MFRC522 RFID:**
```
RFID 3.3V → ESP32 3.3V
RFID RST  → ESP32 GPIO 22
RFID GND  → ESP32 GND
RFID MISO → ESP32 GPIO 19
RFID MOSI → ESP32 GPIO 23
RFID SCK  → ESP32 GPIO 18
RFID SDA  → ESP32 GPIO 5
```

### ESP32 #2 (ENV Cihazı)

**MQ4 Gaz Sensörü:**
```
MQ4 VCC  → ESP32 3.3V
MQ4 GND  → ESP32 GND
MQ4 AOUT → ESP32 GPIO 34 (Analog)
```

**Buzzer (3 Bacaklı Aktif):**
```
Buzzer + (Uzun bacak) → ESP32 GPIO 25
Buzzer - (Kısa bacak) → ESP32 GND
Buzzer S (Orta bacak) → Bağlanmaz
```

---

## 🖥️ Backend Kurulumu

### 1. MongoDB Kurulumu

**MongoDB Atlas (Önerilen):**
1. https://cloud.mongodb.com adresine git
2. Ücretsiz hesap oluştur
3. Cluster oluştur (M0 Free Tier)
4. Database Access → Add New Database User
5. Network Access → Add IP Address (0.0.0.0/0 - tüm IP'ler)
6. Clusters → Connect → Connect your application
7. Connection string'i kopyala

### 2. Gmail SMTP Kurulumu

1. Gmail hesabına giriş yap
2. Hesap Ayarları → Güvenlik
3. 2 Adımlı Doğrulama'yı aktif et
4. https://myaccount.google.com/apppasswords adresine git
5. "Mail" seç ve uygulama şifresi oluştur
6. 16 haneli şifreyi kaydet

### 3. Backend Dosyaları

```bash
cd backend
npm install
```

### 4. .env Dosyası Oluştur

```bash
cp .env.example .env
```

`.env` dosyasını düzenle:

```env
# Server
PORT=4000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/gas_detection?retryWrites=true&w=majority

# JWT
JWT_SECRET_KEY=your_super_secret_jwt_key_min_32_characters_long
JWT_EXPIRE=10d
JWT_REFRESH_SECRET_KEY=your_super_secret_refresh_key_min_32_characters
JWT_REFRESH_EXPIRE=1d
JWT_COOKIE=1000000

# Temp Token
TEMP_TOKEN_EXPIRE=36000000

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_ADMIN=your_email@gmail.com
SMTP_PASS=your_16_digit_app_password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# OTP
OTP_EXPIRE_MINUTES=10
```

### 5. Backend'i Başlat

```bash
npm run dev
```

Başarılı olursa:
```
🚀 IoT Gaz Algılama Sistemi Backend
📡 Server: http://localhost:4000
🔐 Environment: development
📊 MongoDB: Connected
```

---

## 🤖 ESP32 Kurulumu

### 1. Arduino IDE Kurulumu

1. Arduino IDE'yi indir: https://www.arduino.cc/en/software
2. File → Preferences → Additional Board Manager URLs:
   ```
   https://dl.espressif.com/dl/package_esp32_index.json
   ```
3. Tools → Board → Boards Manager → "ESP32" ara ve yükle
4. Tools → Board → ESP32 Arduino → "ESP32 Dev Module" seç

### 2. Kütüphaneleri Yükle

Sketch → Include Library → Manage Libraries:

- **ArduinoJson** (v6.x) - Beniamino Marini
- **MFRC522** (v1.4.x) - GithubCommunity (sadece RFID cihazı için)

### 3. ESP32 #1 (RFID) Kodunu Yükle

1. `ESP32_gas_sensor_rfid.ino` dosyasını aç
2. WiFi bilgilerini düzenle:
   ```cpp
   const char* WIFI_SSID = "WiFi_Adi";
   const char* WIFI_PASS = "WiFi_Sifresi";
   ```
3. Backend IP'sini düzenle:
   ```cpp
   const char* SERVER_UPDATE_URL = "http://192.168.1.100:4000/api/device/update";
   const char* SERVER_RFID_URL   = "http://192.168.1.100:4000/api/device/rfid";
   ```
4. RFID kart UID'sini öğren:
   - Kodu yükle
   - Serial Monitor'ü aç (115200 baud)
   - Kartı okut
   - UID'yi kopyala (örn: 2B:38:C6:01)
   - Kodda güncelle:
     ```cpp
     const byte MASTER_UID[] = { 0x2B, 0x38, 0xC6, 0x01 };
     ```
5. Tools → Port → ESP32'nin bağlı olduğu portu seç
6. Upload butonuna bas

### 4. ESP32 #2 (ENV) Kodunu Yükle

1. `ESP32_gas_sensor_env.ino` dosyasını aç
2. WiFi ve Backend bilgilerini düzenle (yukarıdaki gibi)
3. Upload et

### 5. Serial Monitor ile Test

Her iki ESP32 için:
```
WiFi'ye bağlanıyor: WiFi_Adi
.....
IP: 192.168.1.101

[MQ4] Gaz sensörü hazır
=== Sistem Hazır ===
```

---

## 🌐 Frontend Kurulumu

### 1. Bağımlılıkları Yükle

```bash
cd frontend
npm install
```

### 2. .env Dosyası Oluştur

```bash
cp .env.example .env
```

`.env` dosyasını düzenle:
```env
VITE_API_URL=http://localhost:4000
```

### 3. Frontend'i Başlat

```bash
npm run dev
```

Tarayıcıda aç: http://localhost:3000

---

## ✅ Test ve Çalıştırma

### 1. İlk Kullanıcı Kaydı

1. Frontend'de Register sayfasına git
2. Bilgileri doldur:
   - Ad Soyad
   - Email
   - Şifre
   - Adres
3. Email'e gelen OTP kodunu gir
4. Giriş yap

### 2. Cihazları Kaydet

Backend'de cihazları manuel kaydet (Postman veya curl):

```bash
# ESP32 RFID
POST http://localhost:4000/api/device/register
Authorization: Bearer YOUR_JWT_TOKEN
{
  "deviceId": "esp32_rfid",
  "name": "RFID Cihazı",
  "type": "RFID",
  "masterCardUID": "2B:38:C6:01"
}

# ESP32 ENV
POST http://localhost:4000/api/device/register
Authorization: Bearer YOUR_JWT_TOKEN
{
  "deviceId": "esp32_env",
  "name": "Çevre Sensörü",
  "type": "ENV"
}
```

### 3. Sistemi Başlat

1. RFID kartı okut → Sistem başlar
2. Dashboard'da canlı gaz verilerini gör
3. Gaz sensörüne çakmak yaklaştır (test için)
4. Buzzer'ların ötmesini ve email gelmesini bekle
5. RFID kartı tekrar okut → Sistem durur

### 4. MQ4 Sensör Kalibrasyonu

MQ4 sensörü ilk kullanımda 24-48 saat ısınmalıdır. Kalibrasyon için:

1. Temiz havada 24 saat çalıştır
2. Serial Monitor'de PPM değerlerini gözlemle
3. Gerekirse `ESP32_gas_sensor_*.ino` dosyalarında map fonksiyonunu ayarla:
   ```cpp
   float gasPPM = map(gasValue, 0, 4095, 0, 10000);
   ```

---

## 🔧 Sorun Giderme

### ESP32 WiFi'ye Bağlanamıyor
- SSID ve şifre doğru mu?
- WiFi 2.4GHz mi? (ESP32 5GHz desteklemez)
- Router'ın MAC filtrelemesi var mı?

### Backend'e Veri Gönderilemiyor
- Backend çalışıyor mu? (`npm run dev`)
- IP adresi doğru mu?
- Firewall backend portunu engelliyor mu?

### Buzzer Çalışmıyor
- Buzzer aktif mi? (3 bacaklı)
- Bağlantılar doğru mu?
- GPIO 25 başka bir şey tarafından kullanılıyor mu?

### Email Gelmiyor
- Gmail uygulama şifresi doğru mu?
- 2FA aktif mi?
- Spam klasörünü kontrol et

### Gaz Algılanmıyor
- MQ4 sensör ısındı mı? (24-48 saat)
- Analog pin doğru mu? (GPIO 34)
- Sensör çalışıyor mu? (LED yanıyor mu?)

---

## 📞 Destek

Sorun yaşıyorsanız:
1. Serial Monitor loglarını kontrol edin
2. Backend console loglarını kontrol edin
3. Arıza bildirimi oluşturun
4. GitHub Issues'da sorun açın

---

## 🎉 Tebrikler!

Sisteminiz hazır! Artık evinizi gaz sızıntılarına karşı koruyabilirsiniz.

**Önemli Güvenlik Notları:**
- Bu sistem profesyonel bir güvenlik sistemi değildir
- Kritik uygulamalar için sertifikalı ekipman kullanın
- Gaz algılandığında hemen havalandırın
- Gerekirse acil servisleri arayın (112)
