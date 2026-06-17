require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Device = require('../models/Device');
const SensorData = require('../models/SensorData');

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB bağlantısı başarılı\n');

    // Mevcut verileri temizle (dikkatli kullan!)
    console.log('🗑️  Mevcut veriler temizleniyor...');
    await User.deleteMany({});
    await Device.deleteMany({});
    await SensorData.deleteMany({});
    console.log('✅ Veriler temizlendi\n');

    // Test kullanıcısı oluştur
    console.log('👤 Test kullanıcısı oluşturuluyor...');
    const testUser = await User.create({
      name: 'Test Kullanıcı',
      email: 'test@example.com',
      password: 'Test123',
      address: {
        street: 'Test Sokak No:1',
        city: 'İstanbul',
        zipCode: '34000',
        country: 'Türkiye'
      },
      role: 'user',
      isEmailVerified: true
    });
    console.log(`✅ Test kullanıcısı: ${testUser.email}\n`);

    // Admin kullanıcısı oluştur
    console.log('👨‍💼 Admin kullanıcısı oluşturuluyor...');
    const adminUser = await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'Admin123',
      address: {
        street: 'Admin Sokak No:1',
        city: 'Ankara',
        zipCode: '06000',
        country: 'Türkiye'
      },
      role: 'admin',
      isEmailVerified: true
    });
    console.log(`✅ Admin kullanıcısı: ${adminUser.email}\n`);

    // Test cihazları oluştur
    console.log('📱 Test cihazları oluşturuluyor...');
    const device1 = await Device.create({
      deviceId: 'esp32_rfid',
      owner: testUser._id,
      name: 'RFID Cihazı',
      type: 'RFID',
      masterCardUID: '2B:38:C6:01',
      status: 'offline'
    });

    const device2 = await Device.create({
      deviceId: 'esp32_env',
      owner: testUser._id,
      name: 'Sıcaklık/Nem Sensörü',
      type: 'ENV',
      status: 'offline'
    });

    testUser.devices = [device1._id, device2._id];
    await testUser.save();

    console.log(`✅ Cihaz 1: ${device1.deviceId}`);
    console.log(`✅ Cihaz 2: ${device2.deviceId}\n`);

    // Örnek sensor verisi oluştur
    console.log('📊 Örnek sensor verileri oluşturuluyor...');
    const sampleData = [];
    for (let i = 0; i < 20; i++) {
      sampleData.push({
        deviceId: 'esp32_env',
        user: testUser._id,
        ssid: 'TestWiFi',
        bssid: 'AA:BB:CC:DD:EE:FF',
        channel: 6,
        rssi_raw: -65 + Math.floor(Math.random() * 10),
        rssi_avg: -64 + Math.floor(Math.random() * 10),
        rssi_ema: -63 + Math.floor(Math.random() * 10),
        delta: Math.floor(Math.random() * 15),
        temperature: 20 + Math.random() * 10,
        humidity: 40 + Math.random() * 30,
        timestamp: new Date(Date.now() - i * 60000) // Her dakika
      });
    }
    await SensorData.insertMany(sampleData);
    console.log(`✅ ${sampleData.length} adet örnek veri oluşturuldu\n`);

    console.log('🎉 Veritabanı başarıyla seed edildi!\n');
    console.log('📋 Test Hesapları:');
    console.log('   Kullanıcı: test@example.com / Test123');
    console.log('   Admin: admin@example.com / Admin123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
}

seedDatabase();
