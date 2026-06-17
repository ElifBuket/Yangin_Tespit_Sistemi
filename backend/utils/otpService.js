const crypto = require('crypto');

class OTPService {
  // 6 haneli OTP oluştur
  static generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  // OTP süresini hesapla (dakika cinsinden)
  static getOTPExpiry(minutes = 10) {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  // OTP doğrulama
  static verifyOTP(storedOTP, providedOTP, expiresAt) {
    if (!storedOTP || !providedOTP) {
      return { valid: false, message: 'OTP kodu gereklidir' };
    }

    if (new Date() > new Date(expiresAt)) {
      return { valid: false, message: 'OTP kodunun süresi dolmuş' };
    }

    if (storedOTP !== providedOTP) {
      return { valid: false, message: 'Geçersiz OTP kodu' };
    }

    return { valid: true, message: 'OTP doğrulandı' };
  }

  // Kullanıcıya OTP kaydet
  static async saveOTPToUser(user, purpose) {
    const otp = this.generateOTP();
    const expiresAt = this.getOTPExpiry(parseInt(process.env.OTP_EXPIRE_MINUTES) || 10);

    user.otp = {
      code: otp,
      expiresAt,
      purpose
    };

    await user.save();
    return otp;
  }
}

module.exports = OTPService;
