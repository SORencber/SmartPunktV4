const mongoose = require('mongoose');
const Part = require('../models/Part');

// MongoDB bağlantı bilgileri
const MONGODB_URI = 'mongodb://localhost:27017/repair-system';

async function migrate() {
  try {
    console.log('🔄 Migration başlatılıyor...');
    
    // MongoDB bağlantısı
    await mongoose.connect(MONGODB_URI);
    console.log('📦 MongoDB\'ye bağlandı');

    // Önce mevcut parça sayısını kontrol et
    const totalParts = await Part.countDocuments();
    console.log(`📊 Toplam parça sayısı: ${totalParts}`);

    // Tüm parçaları güncelle
    const result = await Part.updateMany(
      {}, // Tüm parçaları seç
      { 
        $set: { 
          serviceFee: {
            amount: 0,
            currency: 'EUR'
          }
        } 
      },
      { upsert: false } // Sadece mevcut dökümanları güncelle
    );

    console.log(`✅ ${result.modifiedCount} parça güncellendi`);
    console.log(`ℹ️ ${result.matchedCount} parça bulundu`);

    // Güncelleme sonrası kontrol
    const updatedParts = await Part.countDocuments({ 'serviceFee.amount': { $exists: true } });
    console.log(`📊 serviceFee alanı olan parça sayısı: ${updatedParts}`);

  } catch (error) {
    console.error('❌ Migration hatası:', error.message);
    if (error.name === 'MongoServerError') {
      console.error('MongoDB sunucu hatası:', error.code);
    }
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('📦 MongoDB bağlantısı kapatıldı');
    }
  }
}

// Script'i çalıştır
migrate().then(() => {
  console.log('✨ Migration tamamlandı');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Beklenmeyen hata:', error);
  process.exit(1);
}); 