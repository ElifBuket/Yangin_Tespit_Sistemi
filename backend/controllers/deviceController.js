const SensorData = require('../models/SensorData');
const Device = require('../models/Device');
const User = require('../models/User');
const GasDetector = require('../utils/gasDetector');
const EmailService = require('../utils/emailService');
const PDFGenerator = require('../utils/pdfGenerator');

// Cihaz durumlarını takip et (memory'de)
const deviceStatusTracker = new Map();

// Buzzer susturma süresi takibi (memory'de) - userId → susturma bitiş zamanı
const buzzerMuteTracker = new Map();

/**
 * ⭐ PYROGUARD AI: Hassasiyeti Artırılmış Yanlış Alarm Sınıflandırma Algoritması
 * @param {String} deviceId - Veriyi gönderen cihaz kimliği
 * @param {Number} currentPPM - Donanımdan gelen anlık PPM değeri
 */
async function aiClassifyGasSource(deviceId, currentPPM) {
  try {
    // Veritabanından o cihaza ait son 3 geçmiş kaydı çekiyoruz (Anlık veriyle toplam 4 veri)
    const pastRecords = await SensorData.find({ deviceId })
      .sort({ timestamp: -1 })
      .limit(3);

    if (pastRecords.length < 3) {
      return { isFalseAlarm: false, sourceType: "Analiz Ediliyor..." };
    }

    // Kronolojik sıraya diz (eskiden yeniye: 15sn önce, 10sn önce, 5sn önce)
    const records = pastRecords.reverse();
    const p1 = records[0].gasPPM || 0; 
    const p2 = records[1].gasPPM || 0; 
    const p3 = records[2].gasPPM || 0; 
    const p4 = currentPPM;        // Şu anki canlı veri

    // 🎯 HASSAS SİNYAL İMZA KONTROLLERİ:
    // Ani Sıçrama (Spike) Eşiğini 250 PPM'e düşürdük. 5 saniyedeki bu dikey ivme kozmetik spreyleri yakalar.
    const suddenJump = (p4 - p3) > 250; 

    // Sönümlenme (Decay Rate) Analizi: Gazın havada hızlıca seyrelip dağılmaya başlama eğilimi
    const isDecaying = (p3 > p4) || (p2 > p4);

    let sourceType = "NORMAL / GÜVENLİ";
    let isFalseAlarm = false;

    // Alt analiz barajını 400 PPM'e esnettik (Hafif kokularda da AI devreye girsin)
    if (p4 >= 400) {
      // KOZMETİK GAZ (Deodorant/Parfüm): Çok ani bir dikey sıçrama yapar ve/veya havada hızla çözünür
      if (suddenJump || isDecaying) {
        sourceType = "Kozmetik Gaz (Deodorant/Parfüm)";
        isFalseAlarm = true;
      } else {
        // YANGIN / SÜREKLİ GAZ KAÇAĞI: Gaz kararlı yükselir, tepe noktası çakılmaz, sinsi sinsi tırmanır
        sourceType = "Kritik Yangın / Gaz Kaçağı";
        isFalseAlarm = false;
      }
    }

    return { isFalseAlarm, sourceType };
  } catch (error) {
    console.error("❌ PyroGuard AI Error:", error);
    return { isFalseAlarm: false, sourceType: "AI Sistem Hatası" };
  }
}

// @desc    ESP32'den gaz verisi al
// @route   POST /api/device/update
// @access  Public (ESP32'den geliyor)
exports.receiveData = async (req, res) => {
  try {
    const data = req.body;
    const deviceId = data.device_id;

    if (!deviceId) {
      return res.status(400).json({
        status: 'error',
        message: 'device_id gereklidir'
      });
    }

    // Cihazı bul
    let device = await Device.findOne({ deviceId }).populate('owner');

    if (!device) {
      return res.status(404).json({
        status: 'error',
        message: 'Cihaz kayıtlı değil. Lütfen önce cihazı kaydedin.'
      });
    }

    // 🛡️ KALİBRASYON / EKSİ DEĞER FİLTRESİ
    const rawGasPPM = data.gas_ppm || 0;
    const safeGasPPM = Math.max(0, rawGasPPM);

    // Cihaz durumunu güncelle
    device.isActive = true;
    device.lastSeen = new Date();
    device.status = 'online';

    // Gaz seviyesini analiz et (Geleneksel eşik kontrolü)
    const gasAnalysis = GasDetector.analyzeGasLevel(safeGasPPM);

    // ⭐ PYROGUARD AI RUN: Canlı gelen veriyi Yapay Zeka Sınıflandırıcısına sokuyoruz
    const aiResult = await aiClassifyGasSource(deviceId, safeGasPPM);

    console.log(`📊 [${deviceId}] Gaz: ${safeGasPPM.toFixed(0)} PPM | AI Sınıflandırma: ${aiResult.sourceType} | False Alarm: ${aiResult.isFalseAlarm}`);

    // Sensor verisini kaydet
    const sensorData = await SensorData.create({
      deviceId: data.device_id,
      user: device.owner._id,
      gasValue: data.gas_value,
      gasPPM: safeGasPPM,
      gasDetected: gasAnalysis.detected,
      gasLevel: gasAnalysis.level,
      scannerIp: data.scanner_ip
    });

    // Sistem başlatılmış mı kontrol et
    const userDevices = await Device.find({ owner: device.owner._id });
    const isSystemStarted = userDevices.some(d => d.systemStatus === 'started');

    // Gaz uyarısı gönder (gerekirse)
    if (isSystemStarted && gasAnalysis.shouldAlert && !aiResult.isFalseAlarm) {
      const lastAlert = deviceStatusTracker.get(`${device.owner._id}_gas_alert`);
      const now = Date.now();

      if (!lastAlert || (now - lastAlert) > 5 * 60 * 1000) {
        await EmailService.sendGasAlert(
          device.owner.email,
          device.owner.name,
          {
            deviceId: deviceId,
            gasPPM: safeGasPPM,
            level: gasAnalysis.level,
            message: gasAnalysis.message
          },
          device.owner._id.toString()
        );

        device.lastGasAlert = new Date();
        deviceStatusTracker.set(`${device.owner._id}_gas_alert`, now);
        console.log(`🚨 Gaz uyarısı gönderildi: ${device.owner.email}`);
      }
    }

    // ⭐ BUZZER KONTROLÜ - HERHANGİ BİR CİHAZDA GAZ VARSA TÜM BUZZER'LAR ÖTER
    let shouldAllBuzzersBeActive = false;

    // Kullanıcı buzzer'ı susturmuş mu kontrol et (Memory Mute Check)
    const muteUntil = buzzerMuteTracker.get(device.owner._id.toString());
    const isMuted = muteUntil && Date.now() < muteUntil;

    if (isMuted) {
      console.log(`🔇 Buzzer susturulmuş, ${Math.round((muteUntil - Date.now()) / 1000)}s kaldı`);
      shouldAllBuzzersBeActive = false;
    } else if (isSystemStarted) {
      
      // 🛡️ CRITICAL GLOBAL AI GUARD: Eğer Yapay Zeka "Bu bir yanlış alarm/deodoranttır" teşhisi koyduysa,
      // veritabanındaki son 10 saniyelik eski kayıtlara bakılmaksızın alarmı KESİNLİKLE sustur!
      if (aiResult.isFalseAlarm) {
        shouldAllBuzzersBeActive = false;
        console.log(`💡 [AI ENGELLEMESİ] ${deviceId} için Deodorant algılandığından alarm tamamen engellendi.`);
      } else {
        if (gasAnalysis.buzzerActive) {
          shouldAllBuzzersBeActive = true;
        } else {
          // Diğer oda veya cihazlarda son 10 saniyede GERÇEK (AI tarafından onaylanmış) bir gaz var mı?
          const recentGasDetection = await SensorData.findOne({
            user: device.owner._id,
            gasDetected: true,
            gasLevel: { $in: ['warning', 'danger'] },
            timestamp: { $gte: new Date(Date.now() - 10000) }
          }).sort({ timestamp: -1 });

          if (recentGasDetection) {
            shouldAllBuzzersBeActive = true;
          }
        }
      }
    }

    // Tüm cihazların veritabanındaki buzzer durumunu senkronize et
    if (shouldAllBuzzersBeActive) {
      await Device.updateMany(
        { owner: device.owner._id },
        { buzzerActive: true }
      );
      device.buzzerActive = true;
      console.log(`🔊 Tüm buzzer'lar aktif (Gerçek Gaz Algılandı: ${deviceId})`);
    } else {
      await Device.updateMany(
        { owner: device.owner._id },
        { buzzerActive: false }
      );
      device.buzzerActive = false;
      console.log(`🔇 Tüm buzzer'lar kapalı (Güvenli Mod veya AI Deodorant Koruması Devrede)`);
    }

    await device.save();

    // Socket.io ile gerçek zamanlı veri gönder
    if (global.io) {
      global.io.emit('gas_update', {
        deviceId: deviceId,
        gasPPM: safeGasPPM,
        gasLevel: gasAnalysis.level,
        gasDetected: gasAnalysis.detected,
        buzzerActive: device.buzzerActive,
        ai_source_type: aiResult.sourceType,
        ai_is_false_alarm: aiResult.isFalseAlarm,
        timestamp: new Date()
      });
    }

    // ESP32'ye yanıt gönder
    res.status(200).json({
      status: 'ok',
      buzzer_active: device.buzzerActive,
      buzzer_mode: gasAnalysis.level === 'danger' ? 'danger' : 'warning',
      sample_interval_ms: data.sample_interval_ms || 5000
    });

  } catch (error) {
    console.error('Veri alma hatası:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    RFID kart okuma (sistem başlat/durdur)
// @route   POST /api/device/rfid
// @access  Public (ESP32'den geliyor)
exports.handleRFID = async (req, res) => {
  try {
    const { device_id, uid } = req.body;

    if (!device_id || !uid) {
      return res.status(400).json({
        status: 'error',
        message: 'device_id ve uid gereklidir'
      });
    }

    const device = await Device.findOne({ deviceId: device_id }).populate('owner');

    if (!device) {
      return res.status(404).json({
        status: 'error',
        message: 'Cihaz bulunamadı'
      });
    }

    if (uid !== device.masterCardUID) {
      return res.status(403).json({
        status: 'error',
        message: 'Yetkisiz kart'
      });
    }

    const newStatus = device.systemStatus === 'started' ? 'stopped' : 'started';
    device.systemStatus = newStatus;

    if (newStatus === 'started') {
      device.lastStartTime = new Date();
      device.buzzerActive = false;
      await device.save();

      buzzerMuteTracker.delete(device.owner._id.toString());
      console.log(`🔔 Buzzer mute sıfırlandı (sistem başlatıldı)`);

      await EmailService.sendSystemStarted(
        device.owner.email,
        device.owner.name,
        { deviceId: device_id }
      );

      console.log(`✅ Sistem başlatıldı: ${device_id}`);

    } else {
      device.lastStopTime = new Date();
      device.buzzerActive = false;
      await device.save();

      await Device.updateMany(
        { owner: device.owner._id },
        { buzzerActive: false }
      );

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayData = await SensorData.find({
        user: device.owner._id,
        timestamp: { $gte: todayStart }
      }).sort({ timestamp: 1 });

      let reportPDF = null;
      if (todayData.length > 0) {
        reportPDF = await PDFGenerator.generateDailyReport(
          todayData,
          device,
          device.owner.name
        );
      }

      await EmailService.sendSystemStopped(
        device.owner.email,
        device.owner.name,
        { deviceId: device_id },
        reportPDF
      );

      console.log(`🔴 Sistem durduruldu: ${device_id}`);
    }

    if (global.io) {
      global.io.emit('system_status', {
        deviceId: device_id,
        status: newStatus,
        buzzerActive: device.buzzerActive
      });
    }

    res.status(200).json({
      status: 'ok',
      system_status: newStatus,
      buzzer_active: device.buzzerActive
    });

  } catch (error) {
    console.error('RFID işleme hatası:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Cihaz kaydet
// @route   POST /api/device/register
// @access  Private
exports.registerDevice = async (req, res) => {
  try {
    const { deviceId, name, type, masterCardUID } = req.body;

    const existingDevice = await Device.findOne({ deviceId });
    if (existingDevice) {
      return res.status(400).json({
        success: false,
        message: 'Bu cihaz zaten kayıtlı'
      });
    }

    const device = await Device.create({
      deviceId,
      owner: req.user._id,
      name,
      type,
      masterCardUID: masterCardUID || '2B:38:C6:01'
    });

    await User.findByIdAndUpdate(req.user._id, {
      $push: { devices: device._id }
    });

    res.status(201).json({
      success: true,
      message: 'Cihaz başarıyla kaydedildi',
      data: device
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Cihaz kaydedilemedi',
      error: error.message
    });
  }
};

// @desc    Cihaz durumunu kontrol et (offline detection)
// @route   Background job
exports.checkDeviceStatus = async () => {
  try {
    const devices = await Device.find({ isActive: true }).populate('owner');
    const now = new Date();
    const OFFLINE_THRESHOLD = 30 * 1000;

    for (const device of devices) {
      const timeSinceLastSeen = now - new Date(device.lastSeen);

      if (timeSinceLastSeen > OFFLINE_THRESHOLD && device.status === 'online') {
        device.status = 'offline';
        device.isActive = false;
        device.buzzerActive = false;
        await device.save();

        const lastAlertKey = `${device.deviceId}_power_loss_alert`;
        const lastAlert = deviceStatusTracker.get(lastAlertKey);

        if (!lastAlert || (now - lastAlert) > 10 * 60 * 1000) {
          await EmailService.sendDevicePowerLoss(
            device.owner.email,
            device.owner.name,
            {
              deviceId: device.deviceId,
              lastSeen: device.lastSeen
            }
          );

          deviceStatusTracker.set(lastAlertKey, Date.now());
          console.log(`⚠️ Cihaz offline: ${device.deviceId}`);
        }

        if (global.io) {
          global.io.emit('device_status', {
            deviceId: device.deviceId,
            status: 'offline'
          });
        }
      }
    }
  } catch (error) {
    console.error('Cihaz durumu kontrol hatası:', error);
  }
};

// @desc    Buzzer'ı sustur (Email linkinden)
// @route   GET /api/device/mute-buzzer
// @access  Public (Email linkinden geliyor)
exports.muteBuzzer = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).send(`
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial; text-align: center; padding: 50px; background: #f5f5f5; }
              .error { background: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto; }
            </style>
          </head>
          <body>
            <div class="error">
              <h2>❌ Hata</h2>
              <p>Geçersiz istek. Kullanıcı ID'si bulunamadı.</p>
            </div>
          </body>
        </html>
      `);
    }

    const result = await Device.updateMany(
      { owner: userId },
      { buzzerActive: false }
    );

    const MUTE_DURATION = 5 * 60 * 1000;
    buzzerMuteTracker.set(userId, Date.now() + MUTE_DURATION);

    console.log(`🔇 Buzzer susturuldu (Kullanıcı: ${userId}, ${result.modifiedCount} cihaz, 5dk mute)`);

    if (global.io) {
      global.io.emit('buzzer_muted', {
        userId: userId,
        timestamp: new Date()
      });
    }

    res.status(200).send(`
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              margin: 0;
            }
            .success { 
              background: white; 
              padding: 40px; 
              border-radius: 15px; 
              max-width: 500px; 
              margin: 0 auto;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            }
            h2 { color: #28a745; margin-bottom: 20px; }
            p { color: #666; font-size: 16px; line-height: 1.6; }
            .icon { font-size: 64px; margin-bottom: 20px; }
            .note { 
              background: #f8f9fa; 
              padding: 15px; 
              border-radius: 8px; 
              margin-top: 20px;
              font-size: 14px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="success">
            <div class="icon">🔇</div>
            <h2>Buzzer Susturuldu</h2>
            <p>Tüm cihazlarınızın alarm sesi başarıyla kapatıldı.</p>
            <div class="note">
              <strong>⚠️ Önemli:</strong> Gaz seviyesi hala yüksekse, buzzer otomatik olarak tekrar aktif olabilir. Lütfen ortamı havalandırın.
            </div>
          </div>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('Buzzer susturma hatası:', error);
    res.status(500).send(`
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial; text-align: center; padding: 50px; background: #f5f5f5; }
            .error { background: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>❌ Hata</h2>
            <p>Buzzer susturulurken bir hata oluştu. Lütfen tekrar deneyin.</p>
          </div>
        </body>
      </html>
    `);
  }
};

module.exports = exports;