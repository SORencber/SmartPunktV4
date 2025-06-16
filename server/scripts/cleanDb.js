const mongoose = require('mongoose');
const DeviceType = require('../models/DeviceType');
const Brand = require('../models/Brand');
const Model = require('../models/Model');
const { logger } = require('../utils/logger');

async function cleanDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/repair-system');
    logger.info('Connected to MongoDB');

    // Delete all records
    await DeviceType.deleteMany({});
    await Brand.deleteMany({});
    await Model.deleteMany({});

    logger.info('Database cleaned successfully');

    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('Error cleaning database', { error: error.message });
    process.exit(1);
  }
}

cleanDatabase(); 