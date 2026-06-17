const { body, validationResult } = require('express-validator');

// Validation sonuçlarını kontrol et
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    return res.status(400).json({
      success: false,
      message: `Lütfen aşağıdaki hataları düzeltin: ${errorMessages.join(', ')}`,
      errors: errors.array()
    });
  }
  next();
};

// Kayıt validasyonu
exports.registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Ad soyad en az 3 karakter olmalıdır')
    .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/)
    .withMessage('Ad soyad sadece harf içermelidir'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Geçerli bir email adresi giriniz')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Şifre en az 6 karakter olmalıdır')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir'),
  
  body('address.street')
    .trim()
    .notEmpty()
    .withMessage('Sokak adresi gereklidir'),
  
  body('address.city')
    .trim()
    .notEmpty()
    .withMessage('Şehir gereklidir'),
  
  body('address.zipCode')
    .trim()
    .notEmpty()
    .withMessage('Posta kodu gereklidir')
    .matches(/^\d{5}$/)
    .withMessage('Geçerli bir posta kodu giriniz (5 haneli)'),
];

// Login validasyonu
exports.loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Geçerli bir email adresi giriniz')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Şifre gereklidir'),
];

// OTP validasyonu
exports.otpValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Geçerli bir email adresi giriniz')
    .normalizeEmail(),
  
  body('otp')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP 6 haneli olmalıdır')
    .isNumeric()
    .withMessage('OTP sadece rakam içermelidir'),
];

// Şifre sıfırlama validasyonu
exports.resetPasswordValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Geçerli bir email adresi giriniz')
    .normalizeEmail(),
  
  body('otp')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP 6 haneli olmalıdır')
    .isNumeric()
    .withMessage('OTP sadece rakam içermelidir'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Yeni şifre en az 6 karakter olmalıdır')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir'),
];

// Arıza bildirimi validasyonu
exports.faultReportValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Başlık gereklidir')
    .isLength({ min: 5, max: 100 })
    .withMessage('Başlık 5-100 karakter arasında olmalıdır'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Açıklama gereklidir')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Açıklama 10-1000 karakter arasında olmalıdır'),
  
  body('category')
    .optional()
    .isIn(['device_offline', 'sensor_error', 'false_alarm', 'connection_issue', 'other'])
    .withMessage('Geçersiz kategori'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Geçersiz öncelik'),
];

// Email validasyonu
exports.emailValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Geçerli bir email adresi giriniz')
    .normalizeEmail(),
];
