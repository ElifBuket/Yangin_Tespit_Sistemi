const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Mongoose ayarları
    mongoose.set('strictQuery', false);
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 saniye timeout
      socketTimeoutMS: 45000, // 45 saniye socket timeout
      family: 4 // IPv4 kullan
    });
    
    console.log(`✅ MongoDB bağlantısı başarılı: ${conn.connection.host}`);
    
    // Bağlantı olaylarını dinle
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB bağlantı hatası:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB bağlantısı kesildi');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB yeniden bağlandı');
    });
    
  } catch (error) {
    console.error(`❌ MongoDB bağlantı hatası: ${error.message}`);
    console.error('Lütfen MongoDB Atlas bağlantı string\'ini kontrol edin');
    console.error('1. MongoDB Atlas\'ta IP whitelist\'e 0.0.0.0/0 ekleyin');
    console.error('2. Kullanıcı adı ve şifrenin doğru olduğundan emin olun');
    console.error('3. İnternet bağlantınızı kontrol edin');
    process.exit(1);
  }
};

module.exports = connectDB;
