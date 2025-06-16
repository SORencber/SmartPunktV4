const mongoose = require('mongoose');
const Part = require('../models/Part');
const { logger } = require('../utils/logger');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/repair-system';

async function updateParts() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Tüm parçaları bul
    const parts = await Part.find({});
    logger.info(`Found ${parts.length} parts to update`);

    let updated = 0;
    let errors = 0;

    // Her parçayı güncelle
    for (const part of parts) {
      try {
        // Yeni alanları ekle (eğer yoksa)
        const updates = {
          stock: part.stock ?? 0,
          minStockLevel: part.minStockLevel ?? 5,
          cost: part.cost ?? 0,
          price: part.price ?? 0,
          margin: part.margin ?? 20,
          shelfNumber: part.shelfNumber ?? "0",
          compatibleWith: part.compatibleWith ?? [],
          updatedBy: part.updatedBy ?? {
            id: new mongoose.Types.ObjectId('684153263f015deb5a51c4c6'), // Admin user ID
            email: 'admin@repairsystem.com',
            fullName: 'Admin User'
          }
        };

        // Parçayı güncelle
        await Part.findByIdAndUpdate(part._id, {
          $set: updates
        }, { new: true });

        updated++;
        
        // Her 100 parçada bir log
        if (updated % 100 === 0) {
          logger.info(`Updated ${updated} parts so far`);
        }
      } catch (error) {
        logger.error(`Error updating part ${part._id}:`, error);
        errors++;
      }
    }

    logger.info('Update completed', {
      total: parts.length,
      updated,
      errors
    });

  } catch (error) {
    logger.error('Script error:', error);
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Scripti çalıştır
updateParts().catch(console.error); 