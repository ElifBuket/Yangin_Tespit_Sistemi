/**
 * Gaz Algılama Modülü
 * MQ4 sensörü için gaz seviyesi analizi
 */

// Gaz seviyesi eşikleri (PPM cinsinden)
// TEST MOD - Düşük eşikler
const GAS_THRESHOLDS = {
  WARNING: 50,   // TEST: 50 PPM - Uyarı seviyesi  (normal: 1000)
  DANGER: 200    // TEST: 200 PPM - Tehlike seviyesi (normal: 3000)
};

/**
 * Gaz seviyesini analiz et
 * @param {number} gasPPM - PPM cinsinden gaz değeri
 * @returns {object} - Analiz sonucu
 */
function analyzeGasLevel(gasPPM) {
  let level = 'safe';
  let detected = false;
  let shouldAlert = false;
  let buzzerActive = false;

  if (gasPPM >= GAS_THRESHOLDS.DANGER) {
    level = 'danger';
    detected = true;
    shouldAlert = true;
    buzzerActive = true;
  } else if (gasPPM >= GAS_THRESHOLDS.WARNING) {
    level = 'warning';
    detected = true;
    shouldAlert = true;
    buzzerActive = true;
  } else {
    level = 'safe';
    detected = false;
    shouldAlert = false;
    buzzerActive = false;
  }

  return {
    level,
    detected,
    shouldAlert,
    buzzerActive,
    threshold: level === 'danger' ? GAS_THRESHOLDS.DANGER : GAS_THRESHOLDS.WARNING,
    message: getGasMessage(level, gasPPM)
  };
}

/**
 * Gaz seviyesine göre mesaj oluştur
 * @param {string} level - Gaz seviyesi (safe, warning, danger)
 * @param {number} gasPPM - PPM değeri
 * @returns {string} - Mesaj
 */
function getGasMessage(level, gasPPM) {
  switch (level) {
    case 'danger':
      return `TEHLİKE! Yüksek gaz seviyesi tespit edildi: ${gasPPM.toFixed(0)} PPM`;
    case 'warning':
      return `UYARI! Gaz seviyesi yükseliyor: ${gasPPM.toFixed(0)} PPM`;
    case 'safe':
      return `Gaz seviyesi normal: ${gasPPM.toFixed(0)} PPM`;
    default:
      return 'Bilinmeyen durum';
  }
}

/**
 * İki cihazdan gelen verileri karşılaştır
 * @param {object} device1Data - 1. cihaz verisi
 * @param {object} device2Data - 2. cihaz verisi
 * @returns {object} - Karşılaştırma sonucu
 */
function compareDevices(device1Data, device2Data) {
  const result1 = analyzeGasLevel(device1Data.gasPPM);
  const result2 = analyzeGasLevel(device2Data.gasPPM);

  // Herhangi biri tehlikeli mi?
  const anyDanger = result1.level === 'danger' || result2.level === 'danger';
  const anyWarning = result1.level === 'warning' || result2.level === 'warning';

  return {
    device1: result1,
    device2: result2,
    overallLevel: anyDanger ? 'danger' : (anyWarning ? 'warning' : 'safe'),
    shouldAlert: result1.shouldAlert || result2.shouldAlert,
    buzzerActive: result1.buzzerActive || result2.buzzerActive
  };
}

module.exports = {
  analyzeGasLevel,
  getGasMessage,
  compareDevices,
  GAS_THRESHOLDS
};
