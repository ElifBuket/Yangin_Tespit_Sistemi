const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// Tüm route'lar admin only
router.use(protect);
router.use(adminOnly);

// Kullanıcı yönetimi
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserDetails);
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id/role', adminController.changeUserRole);

// Arıza bildirimleri
router.get('/fault-reports', adminController.getAllFaultReports);
router.put('/fault-reports/:id', adminController.updateFaultReport);

// Sistem istatistikleri
router.get('/stats', adminController.getSystemStats);

module.exports = router;
