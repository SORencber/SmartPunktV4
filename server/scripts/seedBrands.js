const mongoose = require('mongoose');
const Brand = require('../models/Brand');
const DeviceType = require('../models/DeviceType');
const { logger } = require('../utils/logger');
require('dotenv').config();

const MONGODB_URI = 'mongodb://localhost:27017/repair-system';

const brands = [
  // Telefon Markaları
  {
    name: 'Apple',
    icon: '/brands/apple.svg',
    deviceType: 'Telefon',
    description: 'iPhone üreticisi',
    isActive: true,
    createdBy: {
      id: process.env.ADMIN_USER_ID || '684153263f015deb5a51c4c6',
      email: 'admin@repairsystem.com',
      fullName: 'System Admin'
    }
  },
  {
    name: 'Samsung',
    icon: '/brands/samsung.svg',
    deviceType: 'Telefon',
    description: 'Galaxy serisi telefonlar',
    isActive: true,
    createdBy: {
      id: process.env.ADMIN_USER_ID || '684153263f015deb5a51c4c6',
      email: 'admin@repairsystem.com',
      fullName: 'System Admin'
    }
  },
  {
    name: 'Xiaomi',
    icon: '/brands/xiaomi.svg',
    deviceType: 'Telefon',
    description: 'Mi ve Redmi serisi telefonlar',
    isActive: true,
    createdBy: {
      id: process.env.ADMIN_USER_ID || '684153263f015deb5a51c4c6',
      email: 'admin@repairsystem.com',
      fullName: 'System Admin'
    }
  },
  {
    name: 'Huawei',
    icon: '/brands/huawei.svg',
    deviceType: 'Telefon',
    description: 'P ve Mate serisi telefonlar',
    isActive: true,
    createdBy: {
      id: process.env.ADMIN_USER_ID || '684153263f015deb5a51c4c6',
      email: 'admin@repairsystem.com',
      fullName: 'System Admin'
    }
  },
  {
    name: 'Nothing',
    icon: '/brands/nothing.svg',
    deviceType: 'Telefon',
    description: 'Nothing Phone serisi',
    isActive: true,
    createdBy: {
      id: process.env.ADMIN_USER_ID || '684153263f015deb5a51c4c6',
      email: 'admin@repairsystem.com',
      fullName: 'System Admin'
    }
  },
  {
    name: 'Realme',
    icon: '/brands/realme.svg',
    deviceType: 'Telefon',
    description: 'Realme serisi telefonlar',
    isActive: true,
    createdBy: {
      id: process.env.ADMIN_USER_ID || '684153263f015deb5a51c4c6',
      email: 'admin@repairsystem.com',
      fullName: 'System Admin'
    }
  },
  {
    name: 'Honor',
    icon: '/brands/honor.svg',
    deviceType: 'Telefon',
    description: 'Honor serisi telefonlar',
    isActive: true,
    createdBy: {
      id: process.env.ADMIN_USER_ID || '684153263f015deb5a51c4c6',
      email: 'admin@repairsystem.com',
      fullName: 'System Admin'
    }
  },
  {
    name: 'iQOO',
    icon: '/brands/iqoo.svg',
    deviceType: 'Telefon',
    description: 'iQOO serisi telefonlar',
    isActive: true,
    createdBy: {
      id: process.env.ADMIN_USER_ID || '684153263f015deb5a51c4c6',
      email: 'admin@repairsystem.com',
      fullName: 'System Admin'
    }
  },
  {
    name: 'Meizu',
    icon: '/brands/meizu.svg',
    deviceType: 'Telefon',
    description: 'Meizu serisi telefonlar',
    isActive: true,
    createdBy: {
      id: process.env.ADMIN_USER_ID || '684153263f015deb5a51c4c6',
      email: 'admin@repairsystem.com',
      fullName: 'System Admin'
    }
  },

  // Tablet Markaları
  {
    name: 'Apple',
    icon: '/brands/apple.svg',
    deviceType: 'Tablet',
    description: 'iPad serisi tabletler',
    isActive: true,
    createdBy: {
      id: process.env.ADMIN_USER_ID || '684153263f015deb5a51c4c6',
      email: 'admin@repairsystem.com',
      fullName: 'System Admin'
    }
  },
  {
    name: 'Samsung',
    icon: '/brands/samsung.svg',
    deviceType: 'Tablet',
    description: 'Galaxy Tab serisi tabletler',
    isActive: true,
    createdBy: {
      id: process.env.ADMIN_USER_ID || '684153263f015deb5a51c4c6',
      email: 'admin@repairsystem.com',
      fullName: 'System Admin'
    }
  },
  {
    name: 'Xiaomi',
    icon: '/brands/xiaomi.svg',
    deviceType: 'Tablet',
    description: 'Mi Pad serisi tabletler',
    isActive: true,
    createdBy: {
      id: process.env.ADMIN_USER_ID || '684153263f015deb5a51c4c6',
      email: 'admin@repairsystem.com',
      fullName: 'System Admin'
    }
  },

  // Laptop Markaları
  {
    name: 'Apple',
    icon: '/brands/apple.svg',
    deviceType: 'Laptop',
    description: 'MacBook serisi laptoplar',
    isActive: true,
    createdBy: {
      id: process.env.ADMIN_USER_ID || '684153263f015deb5a51c4c6',
      email: 'admin@repairsystem.com',
      fullName: 'System Admin'
    }
  },
  {
    name: 'Samsung',
    icon: '/brands/samsung.svg',
    deviceType: 'Laptop',
    description: 'Galaxy Book serisi laptoplar',
    isActive: true,
    createdBy: {
      id: process.env.ADMIN_USER_ID || '684153263f015deb5a51c4c6',
      email: 'admin@repairsystem.com',
      fullName: 'System Admin'
    }
  },
  {
    name: 'Xiaomi',
    icon: '/brands/xiaomi.svg',
    deviceType: 'Laptop',
    description: 'Mi Notebook serisi laptoplar',
    isActive: true,
    createdBy: {
      id: process.env.ADMIN_USER_ID || '684153263f015deb5a51c4c6',
      email: 'admin@repairsystem.com',
      fullName: 'System Admin'
    }
  },

  // Masaüstü Markaları
  {
    name: 'Apple',
    icon: '/brands/apple.svg',
    deviceType: 'Masaüstü',
    description: 'iMac ve Mac Pro serisi',
    isActive: true,
    createdBy: {
      id: process.env.ADMIN_USER_ID || '684153263f015deb5a51c4c6',
      email: 'admin@repairsystem.com',
      fullName: 'System Admin'
    }
  },

  // Akıllı Saat Markaları
  {
    name: 'Apple',
    icon: '/brands/apple.svg',
    deviceType: 'Akıllı Saat',
    description: 'Apple Watch serisi',
    isActive: true,
    createdBy: {
      id: process.env.ADMIN_USER_ID || '684153263f015deb5a51c4c6',
      email: 'admin@repairsystem.com',
      fullName: 'System Admin'
    }
  },
  {
    name: 'Samsung',
    icon: '/brands/samsung.svg',
    deviceType: 'Akıllı Saat',
    description: 'Galaxy Watch serisi',
    isActive: true,
    createdBy: {
      id: process.env.ADMIN_USER_ID || '684153263f015deb5a51c4c6',
      email: 'admin@repairsystem.com',
      fullName: 'System Admin'
    }
  },
  {
    name: 'Xiaomi',
    icon: '/brands/xiaomi.svg',
    deviceType: 'Akıllı Saat',
    description: 'Mi Watch serisi',
    isActive: true,
    createdBy: {
      id: process.env.ADMIN_USER_ID || '684153263f015deb5a51c4c6',
      email: 'admin@repairsystem.com',
      fullName: 'System Admin'
    }
  },

  // Kulaklık Markaları
  {
    name: 'Apple',
    icon: '/brands/apple.svg',
    deviceType: 'Kulaklık',
    description: 'AirPods serisi',
    isActive: true,
    createdBy: {
      id: process.env.ADMIN_USER_ID || '684153263f015deb5a51c4c6',
      email: 'admin@repairsystem.com',
      fullName: 'System Admin'
    }
  },
  {
    name: 'Samsung',
    icon: '/brands/samsung.svg',
    deviceType: 'Kulaklık',
    description: 'Galaxy Buds serisi',
    isActive: true,
    createdBy: {
      id: process.env.ADMIN_USER_ID || '684153263f015deb5a51c4c6',
      email: 'admin@repairsystem.com',
      fullName: 'System Admin'
    }
  },
  {
    name: 'Xiaomi',
    icon: '/brands/xiaomi.svg',
    deviceType: 'Kulaklık',
    description: 'Mi Buds serisi',
    isActive: true,
    createdBy: {
      id: process.env.ADMIN_USER_ID || '684153263f015deb5a51c4c6',
      email: 'admin@repairsystem.com',
      fullName: 'System Admin'
    }
  }
];

async function seedBrands() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Get device type IDs
    const deviceTypes = await DeviceType.find({});
    const deviceTypeMap = deviceTypes.reduce((map, dt) => {
      map[dt.name] = dt._id;
      return map;
    }, {});

    // Clear existing brands
    await Brand.deleteMany({});
    logger.info('Cleared existing brands');

    // Add deviceTypeId to each brand
    const brandsWithIds = brands.map(brand => ({
      ...brand,
      deviceTypeId: deviceTypeMap[brand.deviceType]
    }));

    // Insert new brands
    const result = await Brand.insertMany(brandsWithIds);
    logger.info('Brands seeded successfully', { count: result.length });

    // Log the created brands
    result.forEach(brand => {
      logger.info(`Created brand: ${brand.name} (${brand._id}) for device type: ${brand.deviceType}`);
    });

    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('Error seeding brands', { error: error.message });
    process.exit(1);
  }
}

seedBrands(); 