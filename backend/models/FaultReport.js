const mongoose = require('mongoose');

const faultReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Arıza başlığı gereklidir'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Arıza açıklaması gereklidir'],
    trim: true
  },
  category: {
    type: String,
    enum: ['device_offline', 'sensor_error', 'false_alarm', 'connection_issue', 'other'],
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'closed'],
    default: 'pending'
  },
  deviceId: String,
  adminNotes: String,
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FaultReport', faultReportSchema);
