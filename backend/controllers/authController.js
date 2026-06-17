const User = require('../models/User');
const jwt = require('jsonwebtoken');
const OTPService = require('../utils/otpService');
const EmailService = require('../utils/emailService');

// JWT token oluştur
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Refresh token oluştur
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET_KEY, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE
  });
};

// @desc    Kullanıcı kaydı
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, address } = req.body;

    // Kullanıcı zaten var mı?
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Bu email adresi zaten kayıtlı'
      });
    }

    // Yeni kullanıcı oluştur
    const user = await User.create({
      name,
      email,
      password,
      address
    });

    // OTP oluştur ve gönder
    const otp = await OTPService.saveOTPToUser(user, 'email_verification');
    await EmailService.sendOTP(email, otp, 'email_verification');

    res.status(201).json({
      success: true,
      message: 'Kayıt başarılı. Email adresinize doğrulama kodu gönderildi.',
      data: {
        userId: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Kayıt sırasında hata oluştu',
      error: error.message
    });
  }
};

// @desc    Email doğrulama
// @route   POST /api/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email zaten doğrulanmış'
      });
    }

    // OTP doğrula
    const verification = OTPService.verifyOTP(
      user.otp?.code,
      otp,
      user.otp?.expiresAt
    );

    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: verification.message
      });
    }

    // Email'i doğrula
    user.isEmailVerified = true;
    user.clearOTP();
    await user.save();

    // Token oluştur
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email başarıyla doğrulandı',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Doğrulama sırasında hata oluştu',
      error: error.message
    });
  }
};

// @desc    Giriş yap
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kullanıcıyı bul (şifre ile birlikte)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz email veya şifre'
      });
    }

    // Şifre kontrolü
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz email veya şifre'
      });
    }

    // Email doğrulanmış mı?
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Lütfen önce email adresinizi doğrulayın'
      });
    }

    // Token oluştur
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Giriş başarılı',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          petMode: user.petMode
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Giriş sırasında hata oluştu',
      error: error.message
    });
  }
};

// @desc    Şifremi unuttum (OTP gönder)
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Bu email adresi ile kayıtlı kullanıcı bulunamadı'
      });
    }

    // OTP oluştur ve gönder
    const otp = await OTPService.saveOTPToUser(user, 'password_reset');
    await EmailService.sendOTP(email, otp, 'password_reset');

    res.status(200).json({
      success: true,
      message: 'Şifre sıfırlama kodu email adresinize gönderildi'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'İşlem sırasında hata oluştu',
      error: error.message
    });
  }
};

// @desc    Şifre sıfırla
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // OTP doğrula
    const verification = OTPService.verifyOTP(
      user.otp?.code,
      otp,
      user.otp?.expiresAt
    );

    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: verification.message
      });
    }

    // Şifreyi güncelle
    user.password = newPassword;
    user.clearOTP();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Şifreniz başarıyla güncellendi'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Şifre sıfırlama sırasında hata oluştu',
      error: error.message
    });
  }
};

// @desc    OTP yeniden gönder
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = async (req, res) => {
  try {
    const { email, purpose } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Yeni OTP oluştur ve gönder
    const otp = await OTPService.saveOTPToUser(user, purpose);
    await EmailService.sendOTP(email, otp, purpose);

    res.status(200).json({
      success: true,
      message: 'Yeni doğrulama kodu gönderildi'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'OTP gönderimi sırasında hata oluştu',
      error: error.message
    });
  }
};

// @desc    Token yenile
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token gereklidir'
      });
    }

    // Refresh token'ı doğrula
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET_KEY);

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz refresh token'
      });
    }

    // Yeni token oluştur
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token yenileme başarısız',
      error: error.message
    });
  }
};

// @desc    Çıkış yap
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    req.user.refreshToken = undefined;
    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Çıkış başarılı'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Çıkış sırasında hata oluştu',
      error: error.message
    });
  }
};
