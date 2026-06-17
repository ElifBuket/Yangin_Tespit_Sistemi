const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    enum: ['esp32_env', 'esp32_rfid']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['ENV', 'RFID'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'error'],
    default: 'offline'
  },
  systemStatus: {
    type: String,
    enum: ['started', 'stopped'],
    default: 'stopped'
  },
  lastStartTime: Date,
  lastStopTime: Date,
  masterCardUID: {
    type: String,
    default: '2B:38:C6:01'
  },
  buzzerActive: {
    type: Boolean,
    default: false
  },
  lastGasAlert: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Device', deviceSchema);
