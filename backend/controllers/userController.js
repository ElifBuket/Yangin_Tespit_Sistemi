const User = require('../models/User');
const SensorData = require('../models/SensorData');
const FaultReport = require('../models/FaultReport');
const Device = require('../models/Device');
const EmailService = require('../utils/emailService');

// @desc    Kullanıcı profilini getir
// @route   GET /api/user/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -refreshToken -otp')
      .populate('devices');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Profil bilgileri alınamadı',
      error: error.message
    });
  }
};

// @desc    Profil güncelle
// @route   PUT /api/user/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, address } = req.body;

    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (address) user.address = { ...user.address, ...address };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profil güncellendi',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Profil güncellenemedi',
      error: error.message
    });
  }
};

// @desc    Evcil hayvan modunu aç/kapa
// @route   PUT /api/user/pet-mode
// @access  Private
exports.togglePetMode = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.petMode = !user.petMode;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Evcil hayvan modu ${user.petMode ? 'açıldı' : 'kapatıldı'}`,
      data: { petMode: user.petMode }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'İşlem başarısız',
      error: error.message
    });
  }
};

// @desc    Geçmiş verileri getir
// @route   GET /api/user/sensor-data
// @access  Private
exports.getSensorData = async (req, res) => {
  try {
    const { startDate, endDate, deviceId, limit = 100 } = req.query;

    const query = { user: req.user._id };

    if (deviceId) query.deviceId = deviceId;
    
    if (startDate || endDate) {
      query.timestamp = {};
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0); // Günün başlangıcı
        query.timestamp.$gte = start;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Günün sonu
        query.timestamp.$lte = end;
      }
    }

    const data = await SensorData.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Veriler alınamadı',
      error: error.message
    });
  }
};

// @desc    Cihaz durumlarını getir
// @route   GET /api/user/devices
// @access  Private
exports.getDevices = async (req, res) => {
  try {
    const devices = await Device.find({ owner: req.user._id });

    res.status(200).json({
      success: true,
      data: devices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Cihaz bilgileri alınamadı',
      error: error.message
    });
  }
};

// @desc    Arıza bildir
// @route   POST /api/user/fault-report
// @access  Private
exports.createFaultReport = async (req, res) => {
  try {
    const { title, description, category, priority, deviceId } = req.body;

    const faultReport = await FaultReport.create({
      user: req.user._id,
      title,
      description,
      category,
      priority,
      deviceId
    });

    // Admin'e email gönder
    const userInfo = {
      name: req.user.name,
      email: req.user.email,
      address: req.user.address
    };

    await EmailService.sendFaultReportToAdmin(faultReport, userInfo);

    res.status(201).json({
      success: true,
      message: 'Arıza bildirimi oluşturuldu ve yöneticiye iletildi',
      data: faultReport
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Arıza bildirimi oluşturulamadı',
      error: error.message
    });
  }
};

// @desc    Kullanıcının arıza bildirimlerini getir
// @route   GET /api/user/fault-reports
// @access  Private
exports.getFaultReports = async (req, res) => {
  try {
    const reports = await FaultReport.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Arıza bildirimleri alınamadı',
      error: error.message
    });
  }
};

// @desc    İstatistikler
// @route   GET /api/user/stats
// @access  Private
exports.getStats = async (req, res) => {
  try {
    const { period = '24h' } = req.query;

    // Zaman aralığını hesapla
    const now = new Date();
    let startDate;

    switch (period) {
      case '24h':
        startDate = new Date(now - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now - 24 * 60 * 60 * 1000);
    }

    const sensorData = await SensorData.find({
      user: req.user._id,
      timestamp: { $gte: startDate }
    });

    // İstatistikleri hesapla
    const stats = {
      totalMeasurements: sensorData.length,
      avgGasPPM: 0,
      maxGasPPM: 0,
      minGasPPM: 0,
      gasDetections: 0,
      dangerCount: 0,
      warningCount: 0
    };

    if (sensorData.length > 0) {
      const gasData = sensorData.filter(d => d.gasPPM !== null && d.gasPPM !== undefined);
      
      if (gasData.length > 0) {
        stats.avgGasPPM = (gasData.reduce((sum, d) => sum + d.gasPPM, 0) / gasData.length).toFixed(1);
        stats.maxGasPPM = Math.max(...gasData.map(d => d.gasPPM)).toFixed(1);
        stats.minGasPPM = Math.min(...gasData.map(d => d.gasPPM)).toFixed(1);
      }
      
      stats.gasDetections = sensorData.filter(d => d.gasDetected).length;
      stats.dangerCount = sensorData.filter(d => d.gasLevel === 'danger').length;
      stats.warningCount = sensorData.filter(d => d.gasLevel === 'warning').length;
    }

    res.status(200).json({
      success: true,
      period,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'İstatistikler alınamadı',
      error: error.message
    });
  }
};
