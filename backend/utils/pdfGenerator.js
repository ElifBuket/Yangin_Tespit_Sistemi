const PDFDocument = require('pdfkit');

class PDFGenerator {
  static async generateDailyReport(sensorData, deviceInfo, userName) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // ─── 1. BAŞLIK ALANI ───
        doc.fontSize(22).text('IoT Yangin Tespit Sistem Raporu', { align: 'center' });
        doc.fontSize(14).text('Gunluk Rapor', { align: 'center' });
        doc.moveDown(2);

        // ─── 2. KULLANICI VE TARİH BİLGİSİ ───
        doc.fontSize(11);
        doc.text(`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`);
        doc.text(`Kullanici: ${userName}`);
        doc.moveDown(1.5);

        // ─── 3. CİHAZ BİLGİLERİ ───
        doc.fontSize(13).text('Cihaz Bilgileri', { underline: true });
        doc.fontSize(10);
        doc.moveDown(0.3);
        doc.text(`Cihaz ID: ${deviceInfo.deviceId}`);
        doc.text(`Durum: ${deviceInfo.status ? deviceInfo.status.toUpperCase() : 'ONLINE'}`);
        doc.text(`Durdurma Zamani: ${new Date().toLocaleString('tr-TR')}`);
        doc.moveDown(2);

        // ─── 4. ÖLÇÜM SONUÇLARI ÖZETİ ───
        if (sensorData && sensorData.length > 0) {
          doc.fontSize(13).text('Olcum Sonuclari', { underline: true });
          doc.fontSize(11);
          doc.moveDown(0.3);

          const hasDanger = sensorData.some(d => d.gasLevel === 'danger');
          const statusText = hasDanger 
            ? 'KRITIK SEVIYE (Gaz Kacagi Tespit Edildi)' 
            : 'GUVENLI (Tehlike Algilanmadi)';

          doc.text(`Gunluk Olcum Durumu: ${statusText}`);
          doc.moveDown(2); 

          // ─── 5. SON 10 ÖLÇÜM TABLOSU (TÜM İŞARETLERDEN TEMİZLENDİ) ───
          doc.fontSize(13).text('Son Olcumler', { underline: true });
          doc.fontSize(10);
          doc.moveDown(0.5); 

          // Tablo başlığı
          doc.text('Zaman                | Gaz (PPM) | Durum');
          doc.moveDown(0.5); 

          const recentData = sensorData.slice(-10);

          recentData.forEach(data => {
            const time = new Date(data.timestamp).toLocaleTimeString('tr-TR');
            const gas = data.gasPPM ? data.gasPPM.toFixed(1) : '0.0';
            
            let displayStatus = 'GUVENLI';
            if (data.gasLevel === 'danger') displayStatus = 'TEHLIKE';
            else if (data.gasLevel === 'warning') displayStatus = 'UYARI';

            // Satırları çirkin işaretler olmadan sadece metin olarak yazdırıyoruz
            doc.text(`${time.padEnd(20)} | ${gas.padEnd(9)} | ${displayStatus}`);
          });

          doc.moveDown(2); 
        }

        // ─── 6. FOOTER & İMZA ALANI ───
        doc.moveDown(1.5);
        doc.fontSize(10).text('Bu sistem Elif Buket DUMAN & Zehra KOZAN tarafindan gelistirilmistir.', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(8).text('Bu rapor otomatik olarak olusturulmustur.', { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = PDFGenerator;