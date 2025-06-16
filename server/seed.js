const mongoose = require('mongoose');
const User = require('./models/User');
const Customer = require('./models/Customer');
const Order = require('./models/Order');
const Branch = require('./models/Branch');
const Product = require('./models/Product');

// Sample data
const sampleBranches = [
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Downtown Branch',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    phone: '212-555-0101',
    email: 'downtown@repairflowpro.com',
    manager: 'John Smith',
    isActive: true,
    openingHours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '10:00', close: '16:00' },
      sunday: { open: null, close: null }
    },
    services: ['Screen Repair', 'Battery Replacement', 'Data Recovery', 'Software Update']
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Uptown Branch',
    address: {
      street: '456 Park Ave',
      city: 'New York',
      state: 'NY',
      zipCode: '10022',
      country: 'USA'
    },
    phone: '212-555-0202',
    email: 'uptown@repairflowpro.com',
    manager: 'Jane Doe',
    isActive: true,
    openingHours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '10:00', close: '16:00' },
      sunday: { open: null, close: null }
    },
    services: ['Screen Repair', 'Battery Replacement', 'Data Recovery', 'Software Update', 'Water Damage Repair']
  }
];

const sampleUsers = [
  {
    email: 'admin@repairflowpro.com',
    password: 'admin123456',
    name: 'Admin User',
    role: 'admin',
    isActive: true
  },
  {
    email: 'hq@repairflowpro.com',
    password: 'hq123456',
    name: 'HQ Manager',
    role: 'headquarters',
    isActive: true
  },
  {
    email: 'downtown@repairflowpro.com',
    password: 'downtown123',
    name: 'John Smith',
    role: 'branch_staff',
    branchId: sampleBranches[0]._id,
    isActive: true
  },
  {
    email: 'uptown@repairflowpro.com',
    password: 'uptown123',
    name: 'Jane Doe',
    role: 'branch_staff',
    branchId: sampleBranches[1]._id,
    isActive: true
  },
  {
    email: 'tech1@repairflowpro.com',
    password: 'tech123456',
    name: 'Mike Johnson',
    role: 'technician',
    branchId: sampleBranches[0]._id,
    isActive: true
  },
  {
    email: 'tech2@repairflowpro.com',
    password: 'tech123456',
    name: 'Sarah Wilson',
    role: 'technician',
    branchId: sampleBranches[1]._id,
    isActive: true
  }
];

const sampleCustomers = [
  {
    _id: '64a7b8c9d5e4f123456789ab',
    name: 'John Doe',
    phone: '+1234567890',
    email: 'john.doe@email.com',
    branchId: '64a7b8c9d5e4f123456789ac',
    totalOrders: 5,
    lastOrder: new Date('2024-01-15T10:30:00Z'),
    preferredLanguage: 'EN',
    createdAt: new Date('2023-12-01T08:00:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z')
  },
  {
    _id: '64a7b8c9d5e4f123456789ac',
    name: 'Jane Smith',
    phone: '+1234567891',
    email: 'jane.smith@email.com',
    branchId: '64a7b8c9d5e4f123456789ac',
    totalOrders: 3,
    lastOrder: new Date('2024-01-14T15:20:00Z'),
    preferredLanguage: 'EN',
    createdAt: new Date('2023-11-15T10:00:00Z'),
    updatedAt: new Date('2024-01-14T15:20:00Z')
  },
  {
    _id: '64a7b8c9d5e4f123456789ad',
    name: 'Ali Yılmaz',
    phone: '+905551234567',
    email: 'ali.yilmaz@email.com',
    branchId: '64a7b8c9d5e4f123456789ad',
    totalOrders: 7,
    lastOrder: new Date('2024-01-13T12:45:00Z'),
    preferredLanguage: 'TR',
    createdAt: new Date('2023-10-20T14:30:00Z'),
    updatedAt: new Date('2024-01-13T12:45:00Z')
  }
];

const sampleProducts = [
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'iPhone 14 Screen',
    sku: 'IP14-SCR',
    description: 'Replacement screen for iPhone 14',
    category: 'Screen',
    price: 250,
    cost: 150,
    stock: 10,
    minStock: 2,
    branchId: sampleBranches[0]._id,
    compatibility: [
      { brand: 'Apple', model: 'iPhone 14' }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'iPhone 14 Battery',
    sku: 'IP14-BAT',
    description: 'Replacement battery for iPhone 14',
    category: 'Battery',
    price: 120,
    cost: 60,
    stock: 15,
    minStock: 3,
    branchId: sampleBranches[0]._id,
    compatibility: [
      { brand: 'Apple', model: 'iPhone 14' }
    ]
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Samsung S22 Screen',
    sku: 'SS22-SCR',
    description: 'Replacement screen for Samsung S22',
    category: 'Screen',
    price: 220,
    cost: 120,
    stock: 8,
    minStock: 2,
    branchId: sampleBranches[1]._id,
    compatibility: [
      { brand: 'Samsung', model: 'Galaxy S22' }
    ]
  }
];

const sampleOrders = [
  {
    _id: new mongoose.Types.ObjectId(),
    orderNumber: 'ORD-1001',
    customerId: sampleCustomers[0]._id,
    branchId: sampleBranches[0]._id,
    device: {
      type: 'Phone',
      brand: 'Apple',
      model: 'iPhone 14',
      serialNumber: 'SN123456789',
      condition: 'Cracked screen'
    },
    serviceType: 'Repair',
    description: 'Screen replacement for iPhone 14',
    status: 'in_progress',
    priority: 'high',
    products: [
      {
        productId: sampleProducts[0]._id,
        name: 'iPhone 14 Screen',
        quantity: 1,
        price: 250
      }
    ],
    payment: {
      method: 'card',
      status: 'pending',
      amount: 250,
      paidAmount: 0,
      dueAmount: 250
    },
    estimatedCompletion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    labor: {
      description: 'Screen replacement labor',
      hours: 1,
      rate: 50,
      total: 50
    },
    warranty: {
      isEnabled: true,
      period: 180,
      startDate: new Date(),
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
    },
    barcode: 'ORD1001BAR',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/repair-system')
  .then(async () => {
    console.log('Connected to MongoDB');

    try {
      // Clear existing data
      await Promise.all([
        User.deleteMany({}),
        Customer.deleteMany({}),
        Order.deleteMany({}),
        Branch.deleteMany({}),
        Product.deleteMany({})
      ]);

      // Insert sample data
      await Promise.all([
        Branch.insertMany(sampleBranches),
        User.insertMany(sampleUsers),
        Customer.insertMany(sampleCustomers),
        Product.insertMany(sampleProducts),
        Order.insertMany(sampleOrders)
      ]);

      console.log('Sample data inserted successfully');
      process.exit(0);
    } catch (error) {
      console.error('Error seeding database:', error);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }); 