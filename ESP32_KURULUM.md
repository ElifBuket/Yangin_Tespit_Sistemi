# ESP32 Kurulum Rehberi

## 📋 Gerekli Bilgiler

ESP32 kodlarını yüklemeden önce aşağıdaki bilgileri hazırlayın:

### 1. WiFi Bilgileri
- **SSID**: WiFi ağınızın adı
- **Şifre**: WiFi ağınızın şifresi

### 2. Backend Sunucu IP Adresi

Backend sunucunuzun çalıştığı bilgisayarın **yerel IP adresini** bulun:

**Windows:**
```bash
ipconfig
```
`IPv4 Address` satırındaki IP'yi not edin (örn: `192.168.1.100`)

**Linux/Mac:**
```bash
ifconfig
# veya
ip addr show
```

### 3. RFID Master Kart UID (Sadece RFID versiyonu için)

Master kartınızın UID'sini öğrenmek için:
1. ESP32'yi yükleyin ve çalıştırın
2. Serial Monitor'ü açın (115200 baud)
3. RFID kartınızı okutun
4. Serial Monitor'de görünen UID'yi not edin (örn: `2B:38:C6:01`)

---

## 🔧 Yapılandırma Adımları

### ESP32_gas_sensor_rfid.ino (RFID'li Versiyon)

1. Arduino IDE'de dosyayı açın
2. Aşağıdaki satırları düzenleyin:

```cpp
// WiFi Bilgileri
const char* WIFI_SSID = "WiFi_Aginizin_Adi";      // ← Buraya WiFi adınızı yazın
const char* WIFI_PASS = "WiFi_Sifreniz";          // ← Buraya WiFi şifrenizi yazın

// Sunucu IP Adresi
const char* SERVER_UPDATE_URL = "http://192.168.1.100:4000/api/device/update";  // ← IP'yi değiştirin
const char* SERVER_RFID_URL   = "http://192.168.1.100:4000/api/device/rfid";    // ← IP'yi değiştirin

// Master Kart UID (İlk yüklemeden sonra öğrenip güncelleyin)
const byte MASTER_UID[] = { 0x2B, 0x38, 0xC6, 0x01 };  // ← Kendi kartınızın UID'si
```

### ESP32_gas_sensor_env.ino (Sadece Gaz Sensörü)

1. Arduino IDE'de dosyayı açın
2. Aşağıdaki satırları düzenleyin:

```cpp
// WiFi Bilgileri
const char* WIFI_SSID = "WiFi_Aginizin_Adi";      // ← Buraya WiFi adınızı yazın
const char* WIFI_PASS = "WiFi_Sifreniz";          // ← Buraya WiFi şifrenizi yazın

// Sunucu IP Adresi
const char* SERVER_UPDATE_URL = "http://192.168.1.100:4000/api/device/update";  // ← IP'yi değiştirin
```

---

## 📡 API Endpoint'leri

ESP32 kodları aşağıdaki backend endpoint'lerini kullanır:

| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `/api/device/update` | POST | Gaz sensör verilerini gönderir |
| `/api/device/rfid` | POST | RFID kart okuma verilerini gönderir |

**Not:** Bu endpoint'ler backend'de zaten tanımlı ve çalışıyor. ✅

---

## 🔌 Donanım Bağlantıları

### MQ4 Gaz Sensörü
- **VCC** → 5V
- **GND** → GND
- **AOUT** → GPIO 34 (Analog pin)

### Buzzer (3 Bacaklı - Aktif)
- **+** → GPIO 25
- **-** → GND
- **Orta bacak** → Bağlanmaz

### MFRC522 RFID Modülü (Sadece RFID versiyonu)
- **3.3V** → 3.3V
- **RST** → GPIO 22
- **GND** → GND
- **MISO** → GPIO 19
- **MOSI** → GPIO 23
- **SCK** → GPIO 18
- **SDA(SS)** → GPIO 5

---

## 🚀 Yükleme

1. Arduino IDE'de **ESP32 board desteğini** yükleyin
2. Gerekli kütüphaneleri yükleyin:
   - `WiFi` (ESP32 ile birlikte gelir)
   - `HTTPClient` (ESP32 ile birlikte gelir)
   - `ArduinoJson` (Library Manager'dan)
   - `MFRC522` (Sadece RFID versiyonu için)

3. Doğru board'u seçin: **Tools → Board → ESP32 Dev Module**
4. Doğru portu seçin: **Tools → Port → COM3** (veya ESP32'nizin bağlı olduğu port)
5. **Upload** butonuna basın

---

## 🐛 Hata Ayıklama

### WiFi'ye bağlanamıyor
- SSID ve şifrenin doğru olduğundan emin olun
- WiFi ağının 2.4 GHz olduğundan emin olun (ESP32, 5 GHz'i desteklemez)

### Backend'e bağlanamıyor
- Backend sunucusunun çalıştığından emin olun (`npm start`)
- IP adresinin doğru olduğundan emin olun
- ESP32 ve bilgisayarın aynı ağda olduğundan emin olun
- Firewall'un 4000 portunu engellemediğinden emin olun

### RFID kart okunmuyor
- Bağlantıları kontrol edin
- Kartı okuyucuya yaklaştırın (1-2 cm mesafe)
- Serial Monitor'de hata mesajlarını kontrol edin

---

## 📊 Serial Monitor Çıktısı

Başarılı bağlantı sonrası göreceğiniz çıktı:

```
WiFi'ye bağlanıyor: WiFi_Aginizin_Adi.....
IP: 192.168.1.150
[RFID] Hazır (MASTER kart ile sistem toggle)
[MQ4] Gaz sensörü hazır

=== Sistem Hazır ===
RFID kart okutarak sistemi başlatın/durdurun

[MQ4] Analog: 1234, PPM: 3012.5
[POST] HTTP 200, next=5000 ms
```

---

## 💡 İpuçları

1. **Serial Monitor'ü açık tutun** (115200 baud) - Hata ayıklama için çok faydalı
2. **IP adresini not edin** - ESP32'nin aldığı IP adresini backend'de cihaz kaydı için kullanabilirsiniz
3. **Master kart UID'sini kaydedin** - Kaybetmemek için bir yere not edin
4. **Gaz sensörünü kalibre edin** - İlk kullanımda 24 saat ısınma süresi gerekebilir

---

## 📞 Destek

Sorun yaşarsanız:
1. Serial Monitor çıktısını kontrol edin
2. Backend loglarını kontrol edin
3. Network bağlantısını test edin (`ping 192.168.1.100`)
