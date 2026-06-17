require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createAdminUser() {
  try {
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB bağlantısı başarılı\n');

    // Kullanıcı bilgilerini al
    const name = await question('Admin adı: ');
    const email = await question('Admin email: ');
    const password = await question('Admin şifresi (min 6 karakter): ');
    const street = await question('Sokak adresi: ');
    const city = await question('Şehir: ');
    const zipCode = await question('Posta kodu: ');

    // Email zaten var mı kontrol et
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('\n❌ Bu email adresi zaten kayıtlı!');
      process.exit(1);
    }

    // Admin kullanıcı oluştur
    const adminUser = await User.create({
      name,
      email,
      password,
      address: {
        street,
        city,
        zipCode,
        country: 'Türkiye'
      },
      role: 'admin',
      isEmailVerified: true // Admin için otomatik doğrulama
    });

    console.log('\n✅ Admin kullanıcı başarıyla oluşturuldu!');
    console.log('\n📋 Kullanıcı Bilgileri:');
    console.log(`   ID: ${adminUser._id}`);
    console.log(`   Ad: ${adminUser.name}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Rol: ${adminUser.role}`);
    console.log(`   Email Doğrulandı: ${adminUser.isEmailVerified}`);
    console.log('\n🎉 Artık bu bilgilerle giriş yapabilirsiniz!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Hata:', error.message);
    process.exit(1);
  }
}

createAdminUser();
