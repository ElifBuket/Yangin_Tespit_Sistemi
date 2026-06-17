#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// --------- Wi-Fi ---------
// TODO: Kendi WiFi bilgilerinizi girin
const char* WIFI_SSID = "SUPERONLINE_Wi-Fi_5355";
const char* WIFI_PASS = "6TCTExSb3zS4";

// --------- Sunucu ---------
// TODO: Backend sunucunuzun IP adresini girin (bilgisayarınızın yerel IP'si)
// Windows: ipconfig | Linux/Mac: ifconfig veya ip addr
const char* SERVER_UPDATE_URL = "http://192.168.1.13:4000/api/device/update";
const char* DEVICE_ID         = "esp32_env";

// --------- MQ4 Gaz Sensörü ---------
#define MQ4_PIN 34  // Analog pin (ADC1_CH6)

// --------- Buzzer (3 Bacaklı - Aktif) ---------
#define BUZZER_PIN 25

// --------- Zamanlama ---------
unsigned long sample_interval_ms = 5000;  // 5 saniyede bir veri gönder
unsigned long last_sample = 0;

// --------- Buzzer Kontrolü ---------
bool buzzer_active = false;
String buzzer_mode = "warning";  // "warning" veya "danger"
unsigned long buzzer_start_time = 0;

// Warning: Yavaş aralıklı (bip-bip-bip)
const unsigned long WARNING_BEEP = 200;   // 200ms açık
const unsigned long WARNING_PAUSE = 300;  // 300ms kapalı

// Danger: Hızlı sürekli (bip-bip-bip-bip-bip)
const unsigned long DANGER_BEEP = 100;    // 100ms açık
const unsigned long DANGER_PAUSE = 100;   // 100ms kapalı

// --------- Fonksiyonlar ---------

void sendGasData() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Bağlantı yok.");
    return;
  }

  // MQ4 sensöründen analog değer oku - 5 kez okuyup ortalama al
  int gasValue = 0;
  for (int i = 0; i < 5; i++) {
    gasValue += analogRead(MQ4_PIN);
    delay(10);
  }
  gasValue /= 5;
  
  // PPM'e dönüştürme (yaklaşık - kalibrasyona göre ayarlanmalı)
  // MQ4 için tipik: 300-10000 ppm aralığı
  float gasPPM = map(gasValue, 200, 4095, 0, 3000);

  Serial.printf("[MQ4] Analog: %d, PPM: %.1f\n", gasValue, gasPPM);

  StaticJsonDocument<512> doc;
  doc["device_id"]    = DEVICE_ID;
  doc["gas_value"]    = gasValue;
  doc["gas_ppm"]      = gasPPM;
  doc["timestamp_ms"] = millis();
  doc["scanner_ip"]   = WiFi.localIP().toString();

  String payload;
  serializeJson(doc, payload);

  HTTPClient http;
  http.begin(SERVER_UPDATE_URL);
  http.addHeader("Content-Type", "application/json");
  http.setConnectTimeout(4000);
  http.setTimeout(6000);

  int code = http.POST((uint8_t*)payload.c_str(), payload.length());
  if (code > 0) {
    String resp = http.getString();
    
    // Backend'den buzzer komutu geldi mi kontrol et
    StaticJsonDocument<256> r;
    DeserializationError err = deserializeJson(r, resp);
    if (!err) {
      if (r.containsKey("buzzer_active")) {
        buzzer_active = r["buzzer_active"].as<bool>();
        if (buzzer_active) {
          Serial.println("[BUZZER] Aktif edildi!");
        } else {
          Serial.println("[BUZZER] Devre dışı bırakıldı.");
          digitalWrite(BUZZER_PIN, LOW);
        }
      }
      
      // Buzzer modunu al (warning veya danger)
      if (r.containsKey("buzzer_mode")) {
        buzzer_mode = r["buzzer_mode"].as<String>();
        Serial.printf("[BUZZER] Mod: %s\n", buzzer_mode.c_str());
      }
      
      if (r.containsKey("sample_interval_ms")) {
        unsigned long tmp = r["sample_interval_ms"].as<unsigned long>();
        if (tmp >= 500) {
          sample_interval_ms = tmp;
        }
      }
    }
    
    Serial.printf("[POST] HTTP %d, next=%lu ms\n", code, sample_interval_ms);
  } else {
    Serial.printf("[POST] Hata: %s\n", http.errorToString(code).c_str());
  }
  http.end();
}

void handleBuzzer() {
  if (!buzzer_active) {
    digitalWrite(BUZZER_PIN, LOW);
    return;
  }

  unsigned long now = millis();
  unsigned long elapsed = now - buzzer_start_time;

  // Mod'a göre farklı paternler
  unsigned long beep_duration, pause_duration;
  
  if (buzzer_mode == "danger") {
    // TEHLİKE: Hızlı bip-bip-bip-bip
    beep_duration = DANGER_BEEP;
    pause_duration = DANGER_PAUSE;
  } else {
    // UYARI: Yavaş bip...bip...bip
    beep_duration = WARNING_BEEP;
    pause_duration = WARNING_PAUSE;
  }

  if (elapsed < beep_duration) {
    // Buzzer açık
    digitalWrite(BUZZER_PIN, HIGH);
  } else if (elapsed < beep_duration + pause_duration) {
    // Buzzer kapalı (pause)
    digitalWrite(BUZZER_PIN, LOW);
  } else {
    // Döngüyü yeniden başlat
    buzzer_start_time = now;
  }
}

void setup() {
  Serial.begin(115200);
  delay(500);

  // Buzzer pin
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // WiFi bağlantısı
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.printf("WiFi'ye bağlanıyor: %s", WIFI_SSID);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.print("\nIP: ");
  Serial.println(WiFi.localIP());

  // MQ4 sensör
  pinMode(MQ4_PIN, INPUT);
  Serial.println("[MQ4] Gaz sensörü hazır");
  
  Serial.println("\n=== Sistem Hazır ===");
  Serial.println("Gaz seviyesi izleniyor...");
}

void loop() {
  // 1) Buzzer kontrolü
  handleBuzzer();

  // 2) Gaz verisi gönderme
  unsigned long now = millis();
  if (now - last_sample >= sample_interval_ms) {
    last_sample = now;
    sendGasData();
  }

  delay(10);
}
