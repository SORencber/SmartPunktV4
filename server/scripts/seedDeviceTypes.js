const mongoose = require('mongoose');
const DeviceType = require('../models/DeviceType');
const { logger } = require('../utils/logger');
require('dotenv').config();

const MONGODB_URI = 'mongodb://localhost:27017/repair-system';

const deviceTypes = [
  {
    name: 'Telefon',
    icon: 'Phone',
    description: 'Akıllı telefonlar ve cep telefonları',
    isActive: true,
    createdBy: {
      id: process.env.ADMIN_USER_ID || '684153263f015deb5a51c4c6',
      email: 'admin@repairsystem.com',
      fullName: 'System Admin'
    }
  },
  {
    name: 'Tablet',
    icon: 'Tablet',
    description: 'Tablet bilgisayarlar ve e-okuyucular',
    isActive: true,
    createdBy: {
      id: process.env.ADMIN_USER_ID || '684153263f015deb5a51c4c6',
      email: 'admin@repairsystem.com',
      fullName: 'System Admin'
    }
  },
  {
    name: 'Laptop',
    icon: 'Laptop',
    description: 'Dizüstü bilgisayarlar',
    isActive: true,
    createdBy: {
      id: process.env.ADMIN_USER_ID || '684153263f015deb5a51c4c6',
      email: 'admin@repairsystem.com',
      fullName: 'System Admin'
    }
  },
  {
    name: 'Masaüstü',
    icon: 'Desktop',
    description: 'Masaüstü bilgisayarlar',
    isActive: true,
    createdBy: {
      id: process.env.ADMIN_USER_ID || '684153263f015deb5a51c4c6',
      email: 'admin@repairsystem.com',
      fullName: 'System Admin'
    }
  },
  {
    name: 'Akıllı Saat',
    icon: 'Watch',
    description: 'Akıllı saatler ve fitness takip cihazları',
    isActive: true,
    createdBy: {
      id: process.env.ADMIN_USER_ID || '684153263f015deb5a51c4c6',
      email: 'admin@repairsystem.com',
      fullName: 'System Admin'
    }
  },
  {
    name: 'Kulaklık',
    icon: 'Headphones',
    description: 'Kablolu ve kablosuz kulaklıklar',
    isActive: true,
    createdBy: {
      id: process.env.ADMIN_USER_ID || '684153263f015deb5a51c4c6',
      email: 'admin@repairsystem.com',
      fullName: 'System Admin'
    }
  }
];

async function seedDeviceTypes() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Clear existing device types
    await DeviceType.deleteMany({});
    logger.info('Cleared existing device types');

    // Insert new device types
    const result = await DeviceType.insertMany(deviceTypes);
    logger.info('Device types seeded successfully', { count: result.length });

    // Log the created device types
    result.forEach(dt => {
      logger.info(`Created device type: ${dt.name} (${dt._id})`);
    });

    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('Error seeding device types', { error: error.message });
    process.exit(1);
  }
}

seedDeviceTypes(); 