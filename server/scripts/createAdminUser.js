require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const winston = require('winston');
const Branch = require('../models/Branch');

// Configure winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/repair-system')
  .then(() => logger.info('MongoDB Connected'))
  .catch(err => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

const createAdminUser = async () => {
  try {
    // Bir branch bul veya oluştur
    let branch = await Branch.findOne({ code: 'MERKEZ' });
    if (!branch) {
      branch = await Branch.create({
        name: 'Merkez Şube',
        code: 'MERKEZ',
        address: { city: 'İstanbul' },
        status: 'active',
        managerName: 'System Administrator',
        phone: '+90 212 555 0000'
      });
    }

    // Check if admin user already exists
    let adminUser = await User.findOne({ username: 'admin' });
    if (adminUser) {
      adminUser.password = 'Admin123!';
      adminUser.email = 'admin@repairsystem.com';
      adminUser.fullName = 'System Administrator';
      adminUser.role = 'admin';
      adminUser.preferredLanguage = 'tr';
      adminUser.status = 'active';
      adminUser.branch = branch._id;
      adminUser.permissions = [
        {
          module: 'users',
          actions: ['create', 'read', 'update', 'delete', 'export', 'import']
        },
        {
          module: 'customers',
          actions: ['create', 'read', 'update', 'delete', 'export', 'import']
        },
        {
          module: 'orders',
          actions: ['create', 'read', 'update', 'delete', 'export', 'import']
        },
        {
          module: 'inventory',
          actions: ['create', 'read', 'update', 'delete', 'export', 'import']
        },
        {
          module: 'repairs',
          actions: ['create', 'read', 'update', 'delete', 'export', 'import']
        },
        {
          module: 'branches',
          actions: ['create', 'read', 'update', 'delete', 'export', 'import']
        },
        {
          module: 'reports',
          actions: ['create', 'read', 'update', 'delete', 'export', 'import']
        },
        {
          module: 'settings',
          actions: ['create', 'read', 'update', 'delete', 'export', 'import']
        }
      ];
      await adminUser.save();
      logger.info('Admin user updated successfully:', {
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role,
        branch: adminUser.branch
      });
      process.exit(0);
    }

    // Create admin user (yoksa)
    adminUser = await User.create({
      username: 'admin',
      email: 'admin@repairsystem.com',
      password: 'Admin123!',
      fullName: 'System Administrator',
      role: 'admin',
      preferredLanguage: 'tr',
      status: 'active',
      branch: branch._id,
      permissions: [
        {
          module: 'users',
          actions: ['create', 'read', 'update', 'delete', 'export', 'import']
        },
        {
          module: 'customers',
          actions: ['create', 'read', 'update', 'delete', 'export', 'import']
        },
        {
          module: 'orders',
          actions: ['create', 'read', 'update', 'delete', 'export', 'import']
        },
        {
          module: 'inventory',
          actions: ['create', 'read', 'update', 'delete', 'export', 'import']
        },
        {
          module: 'repairs',
          actions: ['create', 'read', 'update', 'delete', 'export', 'import']
        },
        {
          module: 'branches',
          actions: ['create', 'read', 'update', 'delete', 'export', 'import']
        },
        {
          module: 'reports',
          actions: ['create', 'read', 'update', 'delete', 'export', 'import']
        },
        {
          module: 'settings',
          actions: ['create', 'read', 'update', 'delete', 'export', 'import']
        }
      ]
    });

    logger.info('Admin user created successfully:', {
      username: adminUser.username,
      email: adminUser.email,
      role: adminUser.role,
      branch: adminUser.branch
    });

    process.exit(0);
  } catch (error) {
    logger.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser(); 