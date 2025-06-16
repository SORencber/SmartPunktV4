const mongoose = require('mongoose');
const DeviceType = require('../models/DeviceType');
const Brand = require('../models/Brand');
const { logger } = require('../utils/logger');

async function checkDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/repair-system');
    logger.info('Connected to MongoDB');

    // Check DeviceTypes
    const deviceTypes = await DeviceType.find({});
    logger.info('Device Types:', { count: deviceTypes.length });
    deviceTypes.forEach(dt => {
      logger.info(`- ${dt.name} (${dt._id})`);
    });

    // Check Brands
    const brands = await Brand.find({});
    logger.info('Brands:', { count: brands.length });
    brands.forEach(brand => {
      logger.info(`- ${brand.name} (${brand._id}) - Device Type: ${brand.deviceType}`);
    });

    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('Error checking database', { error: error.message });
    process.exit(1);
  }
}

checkDatabase(); 