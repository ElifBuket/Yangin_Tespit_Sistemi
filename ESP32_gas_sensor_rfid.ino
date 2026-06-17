#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <MFRC522.h>

// --------- 1. AYARLAR (Burayı Kendi Bilgilerinle Güncelle) ---------
const char* WIFI_SSID = "SUPERONLINE_Wi-Fi_5355";
const char* WIFI_PASS = "6TCTExSb3zS4";
const char* SERVER_UPDATE_URL = "http://192.168.1.13:4000/api/device/update";
const char* SERVER_RFID_URL   = "http://192.168.1.13:4000/api/device/rfid";
const char* DEVICE_ID         = "esp32_rfid";

// MASTER kart UID (Seri monitörde gördüğün kendi kart numaranı yaz)
const byte MASTER_UID[]   = { 0x2B, 0x38, 0xC6, 0x01 };
const byte MASTER_UID_LEN = 4;

// --------- 2. PIN TANIMLAMALARI ---------
#define RST_PIN  22
#define SS_PIN   5
#define SCK_PIN  18
#define MISO_PIN 19
#define MOSI_PIN 23
#define MQ4_PIN  34 
#define BUZZER_PIN 25

// --------- 3. DEĞİŞKENLER ---------
MFRC522 mfrc522(SS_PIN, RST_PIN);
unsigned long sample_interval_ms = 5000;
unsigned long last_sample = 0;
unsigned long last_rfid_check = 0;
const unsigned long RFID_CHECK_INTERVAL = 100;
bool buzzer_active = false;
String buzzer_mode = "warning";
unsigned long buzzer_start_time = 0;

// --------- 4. RFID FONKSİYONLARI ---------
bool isMasterCard(byte *uid, byte uidLen) {
  if (uidLen != MASTER_UID_LEN) return false;
  for (byte i = 0; i < uidLen; i++) {
    if (uid[i] != MASTER_UID[i]) return false;
  }
  return true;
}

void sendRfidToggle(byte *uid, byte uidLen) {
  char uidStr[30] = {0};
  char *p = uidStr;
  for (byte i = 0; i < uidLen; i++) {
    p += sprintf(p, "%02X", uid[i]);
    if (i < uidLen - 1) *p++ = ':';
  }
  StaticJsonDocument<256> doc;
  doc["device_id"] = DEVICE_ID;
  doc["uid"] = uidStr;
  doc["timestamp_ms"] = millis();
  String payload;
  serializeJson(doc, payload);
  HTTPClient http;
  http.begin(SERVER_RFID_URL);
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(payload);
  if (code > 0) {
    String resp = http.getString();
    Serial.printf("[RFID] HTTP %d -> %s\n", code, resp.c_str());
  } else {
    Serial.printf("[RFID] Hata: %s\n", http.errorToString(code).c_str());
  }
  http.end();
}

void handleRfid() {
  if (!mfrc522.PICC_IsNewCardPresent()) return;
  if (!mfrc522.PICC_ReadCardSerial()) return;
  Serial.print("[RFID] Kart Algılandı! UID: ");
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    Serial.printf("%02X%s", mfrc522.uid.uidByte[i], (i < mfrc522.uid.size - 1 ? ":" : ""));
  }
  Serial.println();
  if (isMasterCard(mfrc522.uid.uidByte, mfrc522.uid.size)) {
    Serial.println("[RFID] MASTER KART ONAYLANDI!");
    tone(BUZZER_PIN, 2500, 200);
    sendRfidToggle(mfrc522.uid.uidByte, mfrc522.uid.size);
  }
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}

// --------- 5. GAZ VE SUNUCU FONKSİYONLARI ---------
void sendGasData() {
  if (WiFi.status() != WL_CONNECTED) return;
  int gasValue = analogRead(MQ4_PIN);
  float gasPPM = map(gasValue, 200, 4095, 0, 3000);
  Serial.printf("[MQ4] Analog: %d, PPM: %.1f\n", gasValue, gasPPM);
  StaticJsonDocument<512> doc;
  doc["device_id"] = DEVICE_ID;
  doc["gas_value"] = gasValue;
  doc["gas_ppm"] = gasPPM;
  doc["timestamp_ms"] = millis();
  String payload;
  serializeJson(doc, payload);
  HTTPClient http;
  http.begin(SERVER_UPDATE_URL);
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(payload);
  if (code > 0) {
    String resp = http.getString();
    Serial.printf("[POST] HTTP %d, next=%lu ms\n", code, sample_interval_ms);
    StaticJsonDocument<256> r;
    if (!deserializeJson(r, resp)) {
      if (r.containsKey("buzzer_active")) {
        buzzer_active = r["buzzer_active"].as<bool>();
        Serial.printf("[BUZZER] %s\n", buzzer_active ? "Aktif edildi!" : "Devre disi birakildi.");
      }
      if (r.containsKey("buzzer_mode")) {
        buzzer_mode = r["buzzer_mode"].as<String>();
        Serial.printf("[BUZZER] Mod: %s\n", buzzer_mode.c_str());
      }
      if (r.containsKey("sample_interval_ms")) {
        unsigned long tmp = r["sample_interval_ms"].as<unsigned long>();
        if (tmp >= 500) sample_interval_ms = tmp;
      }
    }
  } else {
    Serial.printf("[POST] Hata: %s\n", http.errorToString(code).c_str());
  }
  http.end();
}

// --------- 6. BUZZER KONTROLÜ ---------
void handleBuzzer() {
  if (!buzzer_active) {
    noTone(BUZZER_PIN);
    digitalWrite(BUZZER_PIN, LOW);
    return;
  }
  unsigned long now = millis();
  unsigned long elapsed = now - buzzer_start_time;
  int freq = (buzzer_mode == "danger") ? 3500 : 1800;
  int interval = (buzzer_mode == "danger") ? 150 : 600;
  if (elapsed < interval / 2) {
    tone(BUZZER_PIN, freq);
  } else if (elapsed < interval) {
    noTone(BUZZER_PIN);
  } else {
    buzzer_start_time = now;
  }
}

// --------- 7. SETUP VE LOOP ---------
void setup() {
  Serial.begin(115200);
  delay(1000);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(MQ4_PIN, INPUT);

  // WiFi Bağlantısı
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("WiFi Baglaniyor");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nBaglandi! IP: " + WiFi.localIP().toString());

  // SPI ve RFID Başlatma
  SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN, SS_PIN);
  mfrc522.PCD_Init();

  // Donanım Testi
  byte v = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
  if (v == 0x00 || v == 0xFF) {
    Serial.println("!!! HATA: RFID Modulu bulunamadi!");
  } else {
    Serial.printf("[RFID] Modul Hazir. Versiyon: 0x%02X\n", v);
  }
  Serial.println("=== SISTEM BASLATILDI ===");
}

void loop() {
  unsigned long now = millis();

  // RFID Kontrol
  if (now - last_rfid_check >= RFID_CHECK_INTERVAL) {
    last_rfid_check = now;
    handleRfid();
  }

  // Buzzer Kontrol
  handleBuzzer();

  // Veri Gönderme
  if (now - last_sample >= sample_interval_ms) {
    last_sample = now;
    sendGasData();
  }

  delay(1);
}
