require('dotenv').config();
const EmailService = require('../utils/emailService');

async function testEmail() {
  try {
    console.log('📧 Email servisi test ediliyor...\n');

    const testEmail = process.argv[2];
    
    if (!testEmail) {
      console.log('❌ Kullanım: node scripts/testEmailService.js email@example.com');
      process.exit(1);
    }

    console.log(`📨 Test emaili gönderiliyor: ${testEmail}`);

    // OTP testi
    await EmailService.sendOTP(testEmail, '123456', 'email_verification');
    
    console.log('✅ Test emaili başarıyla gönderildi!');
    console.log('📬 Lütfen gelen kutunuzu kontrol edin.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Email gönderme hatası:', error.message);
    console.log('\n💡 Kontrol edilecekler:');
    console.log('   - .env dosyasında SMTP ayarları doğru mu?');
    console.log('   - Gmail uygulama şifresi doğru mu?');
    console.log('   - 2 adımlı doğrulama açık mı?\n');
    process.exit(1);
  }
}

testEmail();
