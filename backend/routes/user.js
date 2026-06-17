const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, requireEmailVerified } = require('../middleware/auth');
const { faultReportValidation, validate } = require('../middleware/validation');
const { faultReportLimiter } = require('../middleware/rateLimiter');

// Tüm route'lar protected
router.use(protect);
router.use(requireEmailVerified);

// Profil
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

// Evcil hayvan modu
router.put('/pet-mode', userController.togglePetMode);

// Cihazlar
router.get('/devices', userController.getDevices);

// Sensor verileri
router.get('/sensor-data', userController.getSensorData);

// İstatistikler
router.get('/stats', userController.getStats);

// Arıza bildirimi
router.post('/fault-report', faultReportLimiter, faultReportValidation, validate, userController.createFaultReport);
router.get('/fault-reports', userController.getFaultReports);

module.exports = router;
