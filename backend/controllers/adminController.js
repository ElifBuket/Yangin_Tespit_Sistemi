const User = require('../models/User');
const FaultReport = require('../models/FaultReport');
const SensorData = require('../models/SensorData');
const Device = require('../models/Device');

// @desc    Tüm kullanıcıları getir
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password -refreshToken -otp')
      .populate('devices')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Kullanıcılar alınamadı',
      error: error.message
    });
  }
};

// @desc    Kullanıcı detaylarını getir
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -refreshToken -otp')
      .populate('devices');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Kullanıcının son verilerini al
    const recentData = await SensorData.find({ user: user._id })
      .sort({ timestamp: -1 })
      .limit(50);

    // Kullanıcının arıza bildirimlerini al
    const faultReports = await FaultReport.find({ user: user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        user,
        recentData,
        faultReports
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Kullanıcı detayları alınamadı',
      error: error.message
    });
  }
};

// @desc    Tüm arıza bildirimlerini getir
// @route   GET /api/admin/fault-reports
// @access  Private/Admin
exports.getAllFaultReports = async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const reports = await FaultReport.find(query)
      .populate('user', 'name email address')
      .populate('resolvedBy', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await FaultReport.countDocuments(query);

    res.status(200).json({
      success: true,
      data: reports,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Arıza bildirimleri alınamadı',
      error: error.message
    });
  }
};

// @desc    Arıza bildirimini güncelle
// @route   PUT /api/admin/fault-reports/:id
// @access  Private/Admin
exports.updateFaultReport = async (req, res) => {
  try {
    const { status, adminNotes, priority } = req.body;

    const report = await FaultReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Arıza bildirimi bulunamadı'
      });
    }

    if (status) report.status = status;
    if (adminNotes) report.adminNotes = adminNotes;
    if (priority) report.priority = priority;

    if (status === 'resolved' || status === 'closed') {
      report.resolvedAt = new Date();
      report.resolvedBy = req.user._id;
    }

    await report.save();

    res.status(200).json({
      success: true,
      message: 'Arıza bildirimi güncellendi',
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Arıza bildirimi güncellenemedi',
      error: error.message
    });
  }
};

// @desc    Kullanıcı sil
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Admin kendini silemez
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Kendi hesabınızı silemezsiniz'
      });
    }

    // Kullanıcının verilerini sil
    await SensorData.deleteMany({ user: user._id });
    await FaultReport.deleteMany({ user: user._id });
    await Device.deleteMany({ owner: user._id });
    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Kullanıcı ve ilgili veriler silindi'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Kullanıcı silinemedi',
      error: error.message
    });
  }
};

// @desc    Sistem istatistikleri
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDevices = await Device.countDocuments();
    const activeDevices = await Device.countDocuments({ status: 'online' });
    const pendingReports = await FaultReport.countDocuments({ status: 'pending' });
    const totalReports = await FaultReport.countDocuments();

    // Son 24 saatteki ölçüm sayısı
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentMeasurements = await SensorData.countDocuments({
      timestamp: { $gte: last24h }
    });

    // Son 7 gündeki kullanıcı aktivitesi
    const last7days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: last7days }
    });

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          activeLastWeek: activeUsers
        },
        devices: {
          total: totalDevices,
          online: activeDevices,
          offline: totalDevices - activeDevices
        },
        faultReports: {
          total: totalReports,
          pending: pendingReports
        },
        measurements: {
          last24h: recentMeasurements
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'İstatistikler alınamadı',
      error: error.message
    });
  }
};

// @desc    Kullanıcı rolünü değiştir
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz rol'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Kullanıcı rolü güncellendi',
      data: { role: user.role }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Rol güncellenemedi',
      error: error.message
    });
  }
};
