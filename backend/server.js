require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const { generalLimiter } = require('./middleware/rateLimiter');
const deviceController = require('./controllers/deviceController');

// MongoDB bağlantısı
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.IO kurulumu
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Global io instance
global.io = io;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS yapılandırması - Frontend için
app.use(cors({
  origin: [
    'http://localhost:3000',  // React dev server
    'http://localhost:5173',  // Vite dev server
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting (geliştirme sırasında kapalı)
// app.use('/api/', generalLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/device', require('./routes/device'));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'IoT Security System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      user: '/api/user',
      admin: '/api/admin',
      device: '/api/device'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint bulunamadı'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Sunucu hatası',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Socket.IO bağlantıları
io.on('connection', (socket) => {
  console.log('✅ Yeni WebSocket bağlantısı:', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ WebSocket bağlantısı kesildi:', socket.id);
  });
});

// Cihaz durumu kontrolü (her 10 saniyede bir)
setInterval(() => {
  deviceController.checkDeviceStatus();
}, 10000);

// Server başlat
const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  // Yerel IP adresini bul
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  let localIP = 'localhost';
  
  // IPv4 adresini bul
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((iface) => {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address;
      }
    });
  });

  console.log('\n========================================');
  console.log('🚀 IoT Security System Backend');
  console.log('========================================');
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🌐 Network: http://${localIP}:${PORT}`);
  console.log(`🔐 Environment: ${process.env.NODE_ENV}`);
  console.log(`📊 MongoDB: ${process.env.MONGO_URI ? 'Connected' : 'Not configured'}`);
  console.log('========================================');
  console.log('\n📋 API Endpoints:');
  console.log(`   Auth:   http://localhost:${PORT}/api/auth`);
  console.log(`   User:   http://localhost:${PORT}/api/user`);
  console.log(`   Admin:  http://localhost:${PORT}/api/admin`);
  console.log(`   Device: http://localhost:${PORT}/api/device`);
  console.log('\n🔌 WebSocket: Connected');
  console.log('========================================');
  console.log('\n📱 ESP32 YAPILANDIRMASI:');
  console.log('========================================');
  console.log('ESP32 kodlarınızda aşağıdaki URL\'leri kullanın:\n');
  console.log(`const char* SERVER_UPDATE_URL = "http://${localIP}:${PORT}/api/device/update";`);
  console.log(`const char* SERVER_RFID_URL   = "http://${localIP}:${PORT}/api/device/rfid";`);
  console.log('\n💡 Not: ESP32 ve bilgisayarınız aynı WiFi ağında olmalı!');
  console.log('========================================\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };
