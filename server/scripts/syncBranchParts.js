const mongoose = require('mongoose');
const { getBranchPartModel } = require('../models/BranchPart');
const Part = require('../models/Part');
const Branch = require('../models/Branch');
require('dotenv').config();

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB bağlantısı başarılı');
  syncAllBranches();
}).catch(err => {
  console.error('MongoDB bağlantı hatası:', err);
  process.exit(1);
});

// Güncellenebilir alanlar
const UPDATABLE_FIELDS = [
  'name',
  'description',
  'modelId',
  'brandId',
  'deviceTypeId',
  'category',
  'barcode',
  'qrCode',
  'isActive',
  'compatibleWith',
  'cost',
  'margin',
  'minStockLevel',
  'price',
  'shelfNumber',
  'stock',
  'serviceFee'
];

async function syncAllBranches() {
  try {
    console.log('Şube senkronizasyonu başlıyor...');
    
    // Tüm aktif şubeleri al
    const branches = await Branch.find({ isActive: true });
    console.log(`${branches.length} aktif şube bulundu`);

    // Tüm parçaları al
    const parts = await Part.find({ isActive: true });
    console.log(`${parts.length} aktif parça bulundu`);

    const stats = {
      totalBranches: branches.length,
      totalParts: parts.length,
      updatedParts: 0,
      createdParts: 0,
      errors: 0,
      startTime: new Date()
    };

    // Her şube için işlem yap
    for (const branch of branches) {
      console.log(`\nŞube işleniyor: ${branch.name} (${branch._id})`);
      
      // Şube için model oluştur
      const BranchPart = getBranchPartModel(branch._id);
      
      // Her parça için işlem yap
      for (const part of parts) {
        try {
          // Mevcut parçayı kontrol et
          let branchPart = await BranchPart.findOne({ partId: part._id });
          
          if (branchPart) {
            // Parça zaten varsa, sadece güncellenebilir alanları güncelle
            const updateData = {};
            UPDATABLE_FIELDS.forEach(field => {
              if (part[field] !== undefined) {
                updateData[field] = part[field];
              }
            });

            // branch_ ile başlayan alanları koru
            Object.keys(branchPart.toObject()).forEach(key => {
              if (key.startsWith('branch_') && !updateData[key]) {
                updateData[key] = branchPart[key];
              }
            });

            await BranchPart.updateOne(
              { _id: branchPart._id },
              { $set: updateData }
            );
            stats.updatedParts++;
          } else {
            // Yeni parça oluştur
            const newBranchPart = new BranchPart({
              partId: part._id,
              ...UPDATABLE_FIELDS.reduce((acc, field) => {
                if (part[field] !== undefined) {
                  acc[field] = part[field];
                }
                return acc;
              }, {}),
              branch_price: part.price, // Şube fiyatını ana fiyattan al
              branch_serviceFee: { amount: 0, currency: 'EUR' },
              branch_createdBy: {
                id: new mongoose.Types.ObjectId(), // Sistem kullanıcısı
                email: 'system@sync',
                fullName: 'System Sync'
              }
            });
            await newBranchPart.save();
            stats.createdParts++;
          }
        } catch (error) {
          console.error(`Hata: Şube ${branch._id}, Parça ${part._id}`, error);
          stats.errors++;
        }
      }
    }

    // İstatistikleri yazdır
    const duration = (new Date() - stats.startTime) / 1000;
    console.log('\nSenkronizasyon tamamlandı!');
    console.log('İstatistikler:');
    console.log(`- Toplam şube: ${stats.totalBranches}`);
    console.log(`- Toplam parça: ${stats.totalParts}`);
    console.log(`- Güncellenen parça: ${stats.updatedParts}`);
    console.log(`- Oluşturulan parça: ${stats.createdParts}`);
    console.log(`- Hatalar: ${stats.errors}`);
    console.log(`- Süre: ${duration.toFixed(2)} saniye`);

    process.exit(0);
  } catch (error) {
    console.error('Senkronizasyon hatası:', error);
    process.exit(1);
  }
} 