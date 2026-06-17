const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_ADMIN,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // OTP gönder
  async sendOTP(email, otp, purpose) {
    const subjects = {
      email_verification: 'E-posta Doğrulama Kodu',
      password_reset: 'Şifre Sıfırlama Kodu',
      login: 'Giriş Doğrulama Kodu'
    };
    const messages = {
      email_verification: 'Hesabınızı doğrulamak için aşağıdaki kodu kullanın.',
      password_reset: 'Şifrenizi sıfırlamak için aşağıdaki kodu kullanın.',
      login: 'Giriş işleminizi tamamlamak için aşağıdaki kodu kullanın.'
    };

    const mailOptions = {
      from: `"GazSense" <${process.env.SMTP_ADMIN}>`,
      to: email,
      subject: subjects[purpose] || 'Doğrulama Kodu',
      html: `
        <!DOCTYPE html><html><head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;background:#0a0f1a;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1a;padding:40px 20px;">
            <tr><td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
                <tr><td style="background:#0d1b2a;border-radius:12px 12px 0 0;padding:24px 32px;border-bottom:2px solid #14b8a6;">
                  <span style="display:inline-block;background:#14b8a6;color:#0a0f1a;font-weight:700;font-size:13px;padding:4px 12px;border-radius:6px;">GAZSENSE</span>
                </td></tr>
                <tr><td style="background:#0d1b2a;padding:32px;text-align:center;">
                  <p style="margin:0 0 8px;color:#64748b;font-size:14px;">${messages[purpose]}</p>
                  <div style="background:#111827;border:1px solid #1e293b;border-radius:10px;padding:24px;margin:20px 0;display:inline-block;">
                    <p style="margin:0;color:#14b8a6;font-size:40px;font-weight:700;letter-spacing:10px;">${otp}</p>
                  </div>
                  <p style="margin:0;color:#334155;font-size:12px;">Bu kod 10 dakika geçerlidir. Kimseyle paylaşmayın.</p>
                </td></tr>
                <tr><td style="background:#080d14;border-radius:0 0 12px 12px;padding:14px 32px;text-align:center;">
                  <p style="margin:0;color:#1e293b;font-size:11px;">GazSense — Akıllı Gaz İzleme Sistemi</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body></html>
      `
    };
    await this.transporter.sendMail(mailOptions);
  }

  // Sistem başlatıldı maili
  async sendSystemStarted(email, userName, deviceInfo) {
    const mailOptions = {
      from: `"GazSense" <${process.env.SMTP_ADMIN}>`,
      to: email,
      subject: '✅ Güvenlik Sistemi Aktif Edildi',
      html: `
        <!DOCTYPE html><html><head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;background:#0a0f1a;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1a;padding:40px 20px;">
            <tr><td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
                <tr><td style="background:#0d1b2a;border-radius:12px 12px 0 0;padding:28px 32px;border-bottom:2px solid #14b8a6;">
                  <span style="display:inline-block;background:#14b8a6;color:#0a0f1a;font-weight:700;font-size:13px;padding:4px 12px;border-radius:6px;">GAZSENSE</span>
                </td></tr>
                <tr><td style="background:#0d1b2a;padding:28px 32px;">
                  <h2 style="margin:0 0 16px;color:#f1f5f9;font-size:20px;">🟢 Sistem Aktif Edildi</h2>
                  <p style="margin:0 0 20px;color:#64748b;font-size:14px;">Merhaba ${userName}, güvenlik sisteminiz başarıyla başlatıldı.</p>
                  <div style="background:#111827;border:1px solid #1e293b;border-radius:8px;padding:16px;">
                    <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;"><strong style="color:#64748b;">Zaman:</strong> ${new Date().toLocaleString('tr-TR')}</p>
                    <p style="margin:0;color:#94a3b8;font-size:13px;"><strong style="color:#64748b;">Cihaz:</strong> ${deviceInfo.deviceId}</p>
                  </div>
                  <p style="margin:20px 0 0;color:#14b8a6;font-size:13px;">Sisteminiz artık aktif olarak izleme yapıyor.</p>
                </td></tr>
                <tr><td style="background:#080d14;border-radius:0 0 12px 12px;padding:14px 32px;text-align:center;">
                  <p style="margin:0;color:#1e293b;font-size:11px;">GazSense — Akıllı Gaz İzleme Sistemi</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body></html>
      `
    };
    await this.transporter.sendMail(mailOptions);
  }

  // Sistem durduruldu + günlük rapor
  async sendSystemStopped(email, userName, deviceInfo, reportPDF) {
    const mailOptions = {
      from: `"GazSense" <${process.env.SMTP_ADMIN}>`,
      to: email,
      subject: '⏹ Güvenlik Sistemi Durduruldu',
      html: `
        <!DOCTYPE html><html><head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;background:#0a0f1a;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1a;padding:40px 20px;">
            <tr><td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
                <tr><td style="background:#0d1b2a;border-radius:12px 12px 0 0;padding:28px 32px;border-bottom:2px solid #475569;">
                  <span style="display:inline-block;background:#14b8a6;color:#0a0f1a;font-weight:700;font-size:13px;padding:4px 12px;border-radius:6px;">GAZSENSE</span>
                </td></tr>
                <tr><td style="background:#0d1b2a;padding:28px 32px;">
                  <h2 style="margin:0 0 16px;color:#f1f5f9;font-size:20px;">⏹ Sistem Durduruldu</h2>
                  <p style="margin:0 0 20px;color:#64748b;font-size:14px;">Merhaba ${userName}, güvenlik sisteminiz durduruldu.</p>
                  <div style="background:#111827;border:1px solid #1e293b;border-radius:8px;padding:16px;">
                    <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;"><strong style="color:#64748b;">Zaman:</strong> ${new Date().toLocaleString('tr-TR')}</p>
                    <p style="margin:0;color:#94a3b8;font-size:13px;"><strong style="color:#64748b;">Cihaz:</strong> ${deviceInfo.deviceId}</p>
                  </div>
                  ${reportPDF ? '<p style="margin:20px 0 0;color:#64748b;font-size:13px;">📊 Günlük rapor ekte yer almaktadır.</p>' : ''}
                </td></tr>
                <tr><td style="background:#080d14;border-radius:0 0 12px 12px;padding:14px 32px;text-align:center;">
                  <p style="margin:0;color:#1e293b;font-size:11px;">GazSense — Akıllı Gaz İzleme Sistemi</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body></html>
      `,
      attachments: reportPDF ? [{
        filename: `rapor-${new Date().toISOString().split('T')[0]}.pdf`,
        content: reportPDF
      }] : []
    };
    await this.transporter.sendMail(mailOptions);
  }

  // Cihaz gücü kesildi
  async sendDevicePowerLoss(email, userName, deviceInfo) {
    const mailOptions = {
      from: `"GazSense" <${process.env.SMTP_ADMIN}>`,
      to: email,
      subject: '⚠️ Cihaz Bağlantısı Kesildi',
      html: `
        <!DOCTYPE html><html><head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;background:#0a0f1a;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1a;padding:40px 20px;">
            <tr><td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
                <tr><td style="background:#0d1b2a;border-radius:12px 12px 0 0;padding:28px 32px;border-bottom:2px solid #f59e0b;">
                  <span style="display:inline-block;background:#14b8a6;color:#0a0f1a;font-weight:700;font-size:13px;padding:4px 12px;border-radius:6px;">GAZSENSE</span>
                </td></tr>
                <tr><td style="background:#0d1b2a;padding:28px 32px;">
                  <h2 style="margin:0 0 16px;color:#f1f5f9;font-size:20px;">⚠️ Cihaz Bağlantısı Kesildi</h2>
                  <p style="margin:0 0 20px;color:#64748b;font-size:14px;">Merhaba ${userName}, bir cihazınızın bağlantısı kesildi.</p>
                  <div style="background:#111827;border:1px solid rgba(245,158,11,0.2);border-radius:8px;padding:16px;">
                    <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;"><strong style="color:#64748b;">Cihaz:</strong> ${deviceInfo.deviceId}</p>
                    <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;"><strong style="color:#64748b;">Son Görülme:</strong> ${deviceInfo.lastSeen ? new Date(deviceInfo.lastSeen).toLocaleString('tr-TR') : 'Bilinmiyor'}</p>
                    <p style="margin:0;color:#94a3b8;font-size:13px;"><strong style="color:#64748b;">Zaman:</strong> ${new Date().toLocaleString('tr-TR')}</p>
                  </div>
                  <p style="margin:20px 0 0;color:#f59e0b;font-size:13px;">Lütfen cihazınızın güç ve ağ bağlantısını kontrol edin.</p>
                </td></tr>
                <tr><td style="background:#080d14;border-radius:0 0 12px 12px;padding:14px 32px;text-align:center;">
                  <p style="margin:0;color:#1e293b;font-size:11px;">GazSense — Akıllı Gaz İzleme Sistemi</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body></html>
      `
    };
    await this.transporter.sendMail(mailOptions);
  }

  // Hareket tespit edildi (hırsızlık uyarısı)
  async sendMotionAlert(email, userName, motionData, petMode) {
    const deviceNames = {
      'esp32_rfid': 'ESP32-RFID (RFID Okuyucu)',
      'esp32_env': 'ESP32-ENV (Sıcaklık/Nem Sensörü)'
    };
    
    const deviceName = deviceNames[motionData.deviceId] || motionData.deviceId;
    
    const mailOptions = {
      from: `"IoT Güvenlik Sistemi" <${process.env.SMTP_ADMIN}>`,
      to: email,
      subject: '🚨 UYARI: Evde Anormal Hareket Tespit Edildi',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8d7da; padding: 20px; border-radius: 10px; border-left: 5px solid #dc3545;">
            <h2 style="color: #721c24; margin-top: 0;">🚨 Anormal Hareket Tespit Edildi</h2>
            <p style="color: #721c24;">Merhaba ${userName},</p>
            <p style="color: #721c24;"><strong>Evinizde anormal bir hareket tespit edildi!</strong></p>
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>Zaman:</strong> ${new Date().toLocaleString('tr-TR')}</p>
              <p style="margin: 5px 0;"><strong>Tespit Eden Cihaz:</strong> ${deviceName}</p>
              <p style="margin: 5px 0;"><strong>Hareket Yoğunluğu:</strong> ${motionData.intensity}</p>
              <p style="margin: 5px 0;"><strong>RSSI Değişimi:</strong> ${motionData.delta} dB</p>
              <p style="margin: 5px 0;"><strong>Evcil Hayvan Modu:</strong> ${petMode ? 'Açık' : 'Kapalı'}</p>
            </div>
            <p style="color: #721c24; font-size: 14px;">⚠️ Lütfen evinizi kontrol edin veya yerel yetkilileri arayın.</p>
          </div>
        </div>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  // Gaz algılandı uyarısı
  async sendGasAlert(email, userName, gasData, userId) {
    const deviceNames = {
      'esp32_rfid': 'RFID Modülü',
      'esp32_env': 'Gaz Sensörü'
    };
    const deviceName = deviceNames[gasData.deviceId] || gasData.deviceId;
    const isDanger = gasData.level === 'danger';
    const serverUrl = process.env.SERVER_URL || 'http://localhost:4000';
    const muteBuzzerUrl = `${serverUrl}/api/device/mute-buzzer?userId=${userId}`;

    const mailOptions = {
      from: `"GazSense Alarm" <${process.env.SMTP_ADMIN}>`,
      to: email,
      subject: isDanger ? '🔴 KRİTİK: Tehlikeli Gaz Seviyesi!' : '🟡 UYARI: Gaz Algılandı',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#0a0f1a;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1a;padding:40px 20px;">
            <tr><td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
                <!-- Header -->
                <tr>
                  <td style="background:#0d1b2a;border-radius:12px 12px 0 0;padding:28px 32px;border-bottom:2px solid ${isDanger ? '#ef4444' : '#f59e0b'};">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <span style="display:inline-block;background:#14b8a6;color:#0a0f1a;font-weight:700;font-size:13px;padding:4px 12px;border-radius:6px;letter-spacing:1px;">GAZSENSE</span>
                          <p style="margin:10px 0 0;color:#94a3b8;font-size:13px;">Akıllı Gaz İzleme Sistemi</p>
                        </td>
                        <td align="right">
                          <span style="font-size:36px;">${isDanger ? '🔴' : '🟡'}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="background:#0d1b2a;padding:28px 32px;">
                    <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:20px;">${isDanger ? 'Kritik Gaz Seviyesi Tespit Edildi' : 'Gaz Uyarısı'}</h2>
                    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">Merhaba ${userName},</p>

                    <!-- Alert Box -->
                    <div style="background:${isDanger ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)'};border:1px solid ${isDanger ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'};border-radius:10px;padding:20px;margin-bottom:24px;">
                      <p style="margin:0;color:${isDanger ? '#fca5a5' : '#fcd34d'};font-size:15px;font-weight:600;">${gasData.message}</p>
                    </div>

                    <!-- Stats -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td width="33%" style="padding:4px;">
                          <div style="background:#111827;border:1px solid #1e293b;border-radius:8px;padding:14px;text-align:center;">
                            <p style="margin:0 0 4px;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:1px;">GAZ SEVİYESİ</p>
                            <p style="margin:0;color:#f1f5f9;font-size:22px;font-weight:700;">${gasData.gasPPM.toFixed(0)}</p>
                            <p style="margin:2px 0 0;color:#475569;font-size:11px;">PPM</p>
                          </div>
                        </td>
                        <td width="33%" style="padding:4px;">
                          <div style="background:#111827;border:1px solid #1e293b;border-radius:8px;padding:14px;text-align:center;">
                            <p style="margin:0 0 4px;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:1px;">DURUM</p>
                            <p style="margin:0;color:${isDanger ? '#f87171' : '#fbbf24'};font-size:14px;font-weight:700;">${isDanger ? 'TEHLİKE' : 'UYARI'}</p>
                          </div>
                        </td>
                        <td width="33%" style="padding:4px;">
                          <div style="background:#111827;border:1px solid #1e293b;border-radius:8px;padding:14px;text-align:center;">
                            <p style="margin:0 0 4px;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:1px;">CİHAZ</p>
                            <p style="margin:0;color:#94a3b8;font-size:12px;font-weight:600;">${deviceName}</p>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0 0 6px;color:#64748b;font-size:13px;">⏰ ${new Date().toLocaleString('tr-TR')}</p>
                    ${isDanger ? '<p style="margin:0 0 24px;color:#f87171;font-size:13px;font-weight:600;">🚨 Gerekirse acil servisleri arayın: 112</p>' : '<p style="margin:0 0 24px;color:#64748b;font-size:13px;">Ortamı havalandırın ve gaz kaynağını kontrol edin.</p>'}

                    <!-- Mute Button -->
                    <div style="text-align:center;margin-top:8px;">
                      <a href="${muteBuzzerUrl}" style="display:inline-block;background:#14b8a6;color:#0a0f1a;font-weight:700;font-size:14px;padding:14px 32px;border-radius:8px;text-decoration:none;">
                        🔇 Alarmı Sustur
                      </a>
                      <p style="margin:12px 0 0;color:#334155;font-size:11px;">Gaz seviyesi yüksek kalmaya devam ederse alarm tekrar aktif olabilir.</p>
                    </div>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background:#080d14;border-radius:0 0 12px 12px;padding:16px 32px;text-align:center;">
                    <p style="margin:0;color:#1e293b;font-size:11px;">GazSense — Akıllı Gaz İzleme Sistemi</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `
    };
    await this.transporter.sendMail(mailOptions);
  }

  // Arıza bildirimi (Admin'e)
  async sendFaultReportToAdmin(faultReport, userInfo) {
    const mailOptions = {
      from: `"IoT Güvenlik Sistemi" <${process.env.SMTP_ADMIN}>`,
      to: process.env.SMTP_ADMIN,
      subject: `🔧 Yeni Arıza Bildirimi - ${faultReport.category}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 10px;">
            <h2 style="color: #856404; margin-top: 0;">🔧 Yeni Arıza Bildirimi</h2>
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="margin-top: 0;">Kullanıcı Bilgileri</h3>
              <p style="margin: 5px 0;"><strong>Ad Soyad:</strong> ${userInfo.name}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${userInfo.email}</p>
              <p style="margin: 5px 0;"><strong>Adres:</strong> ${userInfo.address.street}, ${userInfo.address.city}</p>
              
              <h3>Arıza Detayları</h3>
              <p style="margin: 5px 0;"><strong>Başlık:</strong> ${faultReport.title}</p>
              <p style="margin: 5px 0;"><strong>Kategori:</strong> ${faultReport.category}</p>
              <p style="margin: 5px 0;"><strong>Öncelik:</strong> ${faultReport.priority}</p>
              <p style="margin: 5px 0;"><strong>Açıklama:</strong></p>
              <p style="background-color: #f8f9fa; padding: 10px; border-radius: 5px;">${faultReport.description}</p>
              <p style="margin: 5px 0;"><strong>Zaman:</strong> ${new Date().toLocaleString('tr-TR')}</p>
            </div>
          </div>
        </div>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }
}

module.exports = new EmailService();
