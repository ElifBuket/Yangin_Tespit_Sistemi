const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Gaz sensörü verileri
  gasValue: {
    type: Number,
    default: null
  },
  gasPPM: {
    type: Number,
    default: null
  },
  gasDetected: {
    type: Boolean,
    default: false
  },
  gasLevel: {
    type: String,
    enum: ['safe', 'warning', 'danger'],
    default: 'safe'
  },
  scannerIp: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// 30 gün sonra otomatik silme (opsiyonel)
sensorDataSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('SensorData', sensorDataSchema);
