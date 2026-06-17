const rateLimit = require('express-rate-limit');

// Genel rate limiter
exports.generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 dakika
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login rate limiter (daha sıkı)
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 5, // 5 deneme
  message: {
    success: false,
    message: 'Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.'
  },
  skipSuccessfulRequests: true,
});

// OTP rate limiter
exports.otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 dakika
  max: 3, // 3 OTP isteği
  message: {
    success: false,
    message: 'Çok fazla OTP isteği. 5 dakika sonra tekrar deneyin.'
  },
});

// Arıza bildirimi rate limiter
exports.faultReportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: 10, // 10 arıza bildirimi
  message: {
    success: false,
    message: 'Çok fazla arıza bildirimi. Lütfen daha sonra tekrar deneyin.'
  },
});

// ESP32 data rate limiter (daha gevşek)
exports.esp32Limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 dakika
  max: 100, // 100 istek
  message: {
    success: false,
    message: 'Çok fazla veri gönderimi'
  },
});
