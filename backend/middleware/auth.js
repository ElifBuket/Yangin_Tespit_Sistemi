const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT token doğrulama
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Token'ı header'dan al
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Erişim reddedildi. Lütfen giriş yapın.'
      });
    }

    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // Kullanıcıyı bul
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Geçersiz token',
      error: error.message
    });
  }
};

// Admin kontrolü
exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Bu işlem için admin yetkisi gereklidir'
    });
  }
};

// Email doğrulama kontrolü
exports.requireEmailVerified = (req, res, next) => {
  if (req.user && req.user.isEmailVerified) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Email adresinizi doğrulamanız gerekiyor'
    });
  }
};
