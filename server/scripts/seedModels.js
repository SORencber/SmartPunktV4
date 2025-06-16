const mongoose = require('mongoose');
const Model = require('../models/Model');
const Brand = require('../models/Brand');
const DeviceType = require('../models/DeviceType');
const { logger } = require('../utils/logger');

const MONGODB_URI = 'mongodb://localhost:27017/repair-system';

// Popüler ve en güncel telefon modelleri
const phoneModels = {
  'Apple': [
    // iPhone 16 Serisi (2024)
    'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16',
    // iPhone 15 Serisi
    'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15', 'iPhone 15 SE',
    // iPhone 14 Serisi
    'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14',
    // Diğer iPhone Modelleri
    'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone SE (2024)', 'iPhone SE (2022)', 'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11', 'iPhone XR', 'iPhone XS Max', 'iPhone XS', 'iPhone X'
  ],
  'Samsung': [
    // Galaxy S25 Serisi (2025)
    'Galaxy S25 Ultra', 'Galaxy S25+', 'Galaxy S25',
    // Galaxy Z Serisi (2025)
    'Galaxy Z Fold7', 'Galaxy Z Flip7',
    // Galaxy S24 Serisi
    'Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24',
    // Galaxy Z Serisi (2024)
    'Galaxy Z Fold6', 'Galaxy Z Flip6',
    // Galaxy S23 Serisi
    'Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23',
    // Galaxy A Serisi
    'Galaxy A55', 'Galaxy A54', 'Galaxy A35', 'Galaxy A34',
    // Galaxy M Serisi
    'Galaxy M55', 'Galaxy M54', 'Galaxy M44', 'Galaxy M34',
    // Galaxy F Serisi
    'Galaxy F55', 'Galaxy F54', 'Galaxy F44', 'Galaxy F34'
  ],
  'Xiaomi': [
    // Xiaomi 15 Serisi (2024)
    'Xiaomi 15 Ultra', 'Xiaomi 15 Pro', 'Xiaomi 15',
    // Xiaomi 14 Serisi
    'Xiaomi 14 Ultra', 'Xiaomi 14 Pro', 'Xiaomi 14',
    // Redmi Note Serisi
    'Redmi Note 14 Pro+', 'Redmi Note 14 Pro', 'Redmi Note 14', 'Redmi Note 13 Pro+', 'Redmi Note 13 Pro', 'Redmi Note 13',
    // POCO Serisi
    'POCO F7 Pro', 'POCO F7', 'POCO X7 Pro', 'POCO X7',
    // Redmi Serisi
    'Redmi 14', 'Redmi 13C', 'Redmi 13', 'Redmi 12'
  ],
  'Huawei': [
    // Pura Serisi (2024)
    'Pura 80 Ultra', 'Pura 80 Pro', 'Pura 80',
    // Pura 70 Serisi
    'Pura 70 Ultra', 'Pura 70 Pro', 'Pura 70',
    // Mate Serisi
    'Mate 70 Pro+', 'Mate 70 Pro', 'Mate 70', 'Mate 60 Pro+', 'Mate 60 Pro', 'Mate 60',
    // Nova Serisi
    'Nova 12 Ultra', 'Nova 12 Pro', 'Nova 12', 'Nova 11 Ultra', 'Nova 11 Pro', 'Nova 11'
  ],
  'Nothing': [
    'Nothing Phone (3)', 'Nothing Phone (2a)', 'Nothing Phone (2)', 'Nothing Phone (1)'
  ],
  'Realme': [
    'Realme GT 6 Pro', 'Realme GT 6', 'Realme 13 Pro+', 'Realme 13 Pro', 'Realme 13', 'Realme 12 Pro+', 'Realme 12 Pro', 'Realme 12'
  ],
  'Honor': [
    'Honor Magic7 Pro', 'Honor Magic7', 'Honor 100 Pro', 'Honor 100', 'Honor 90 Pro', 'Honor 90', 'Honor X10 Pro', 'Honor X10'
  ],
  'iQOO': [
    'iQOO 13 Pro', 'iQOO 13', 'iQOO Neo10 Pro', 'iQOO Neo10', 'iQOO Z10 Pro', 'iQOO Z10'
  ],
  'Meizu': [
    'Meizu 22', 'Meizu 21 Pro', 'Meizu 21', 'Meizu 20 Pro', 'Meizu 20'
  ],
  'Motorola': [
    'Edge 60 Ultra', 'Edge 60 Pro', 'Edge 60', 'Edge 50 Ultra', 'Edge 50 Pro', 'Edge 50',
    'Moto G Power 2025', 'Moto G Power 2024', 'Moto G84', 'Moto G74', 'Moto G64',
    'Moto E14', 'Moto E13', 'Moto G200', 'Moto G100'
  ],
  'LG': [
    'LG Velvet 3', 'LG Velvet 2', 'LG Velvet', 'LG Wing 2', 'LG Wing',
    'LG Q93', 'LG Q92 2024', 'LG Q92', 'LG K63', 'LG K53', 'LG K43'
  ]
};

async function seedModels() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Get deviceTypeId for Telefon
    const phoneType = await DeviceType.findOne({ name: 'Telefon' });
    if (!phoneType) throw new Error('Telefon device type not found');

    // Get all brands for Telefon
    const brands = await Brand.find({ deviceTypeId: phoneType._id });
    const brandMap = brands.reduce((map, brand) => {
      map[brand.name] = brand;
      return map;
    }, {});

    // Prepare model documents
    const modelDocs = [];
    for (const [brandName, models] of Object.entries(phoneModels)) {
      const brand = brandMap[brandName];
      if (!brand) continue;
      for (const modelName of models) {
        modelDocs.push({
          name: modelName,
          icon: brand.icon,
          brand: brand.name,
          brandId: brand._id,
          deviceType: phoneType.name,
          deviceTypeId: phoneType._id,
          isActive: true,
          createdBy: brand.createdBy
        });
      }
    }

    // Temizle ve ekle
    await Model.deleteMany({ deviceTypeId: phoneType._id });
    const result = await Model.insertMany(modelDocs);
    logger.info('Phone models seeded successfully', { count: result.length });

    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('Error seeding models', { error: error.message });
    process.exit(1);
  }
}

seedModels(); 