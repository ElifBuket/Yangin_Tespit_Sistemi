const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { loginLimiter, otpLimiter } = require('../middleware/rateLimiter');
const {
  registerValidation,
  loginValidation,
  otpValidation,
  resetPasswordValidation,
  emailValidation,
  validate
} = require('../middleware/validation');

// Kayıt ve doğrulama
router.post('/register', registerValidation, validate, authController.register);
router.post('/verify-email', otpLimiter, otpValidation, validate, authController.verifyEmail);
router.post('/resend-otp', otpLimiter, emailValidation, validate, authController.resendOTP);

// Giriş ve çıkış
router.post('/login', loginLimiter, loginValidation, validate, authController.login);
router.post('/logout', protect, authController.logout);

// Şifre sıfırlama
router.post('/forgot-password', otpLimiter, emailValidation, validate, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, validate, authController.resetPassword);

// Token yenileme
router.post('/refresh-token', authController.refreshToken);

module.exports = router;
