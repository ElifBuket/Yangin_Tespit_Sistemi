const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const { protect } = require('../middleware/auth');
const { esp32Limiter } = require('../middleware/rateLimiter');

// ESP32'den gelen istekler (public)
router.post('/update', esp32Limiter, deviceController.receiveData);
router.post('/rfid', esp32Limiter, deviceController.handleRFID);

// Buzzer susturma (public - email linkinden)
router.get('/mute-buzzer', deviceController.muteBuzzer);

// Kullanıcı cihaz kaydı (protected)
router.post('/register', protect, deviceController.registerDevice);

module.exports = router;
