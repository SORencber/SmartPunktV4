const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Branch = require('../models/Branch');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Order = require('../models/Order');

// MongoDB connection URL
const MONGODB_URI = 'mongodb://localhost:27017/repair_system';

// Sample data
const branches = [
  {
    name: 'Merkez Şube',
    code: 'MERKEZ',
    address: {
      street: 'Atatürk Caddesi No: 1',
      city: 'İstanbul',
      state: 'İstanbul',
      zipCode: '34000',
      country: 'Türkiye'
    },
    phone: '+90 212 555 0001',
    email: 'merkez@repairflowpro.com',
    manager: 'Ahmet Yılmaz',
    openingHours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '10:00', close: '16:00' },
      sunday: { open: '10:00', close: '16:00' }
    },
    services: ['Telefon Tamiri', 'Tablet Tamiri', 'Laptop Tamiri', 'Veri Kurtarma']
  },
  {
    name: 'Kadıköy Şubesi',
    code: 'KADIKOY',
    address: {
      street: 'Bağdat Caddesi No: 100',
      city: 'İstanbul',
      state: 'İstanbul',
      zipCode: '34710',
      country: 'Türkiye'
    },
    phone: '+90 216 555 0002',
    email: 'kadikoy@repairflowpro.com',
    manager: 'Ayşe Demir',
    openingHours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '10:00', close: '16:00' },
      sunday: { open: '10:00', close: '16:00' }
    },
    services: ['Telefon Tamiri', 'Tablet Tamiri', 'Laptop Tamiri']
  }
];

const users = [
  {
    email: 'admin@repairflowpro.com',
    password: 'demo123',
    name: 'Admin User',
    role: 'admin'
  },
  {
    email: 'hq@repairflowpro.com',
    password: 'demo123',
    name: 'HQ Staff',
    role: 'headquarters'
  }
];

const customers = [
  {
    name: 'Mehmet Yılmaz',
    email: 'mehmet@example.com',
    phone: '+90 532 111 2233',
    address: {
      street: 'Örnek Sokak No: 1',
      city: 'İstanbul',
      state: 'İstanbul',
      zipCode: '34000',
      country: 'Türkiye'
    }
  },
  {
    name: 'Zeynep Kaya',
    email: 'zeynep@example.com',
    phone: '+90 533 444 5566',
    address: {
      street: 'Test Caddesi No: 2',
      city: 'İstanbul',
      state: 'İstanbul',
      zipCode: '34700',
      country: 'Türkiye'
    }
  }
];

const products = [
  {
    name: 'iPhone 12 Ekran',
    sku: 'IP12-SCR-001',
    category: 'Screen',
    description: 'iPhone 12 Orijinal Ekran',
    price: 2500,
    cost: 2000,
    stock: 10,
    minStock: 5,
    supplier: {
      name: 'Apple Parts Ltd.',
      contact: 'John Doe',
      phone: '+1 555 123 4567',
      email: 'parts@appleparts.com'
    },
    compatibility: [
      { brand: 'Apple', model: 'iPhone 12' },
      { brand: 'Apple', model: 'iPhone 12 Pro' }
    ]
  },
  {
    name: 'Samsung S21 Batarya',
    sku: 'SS21-BAT-001',
    category: 'Battery',
    description: 'Samsung S21 Orijinal Batarya',
    price: 800,
    cost: 600,
    stock: 15,
    minStock: 5,
    supplier: {
      name: 'Samsung Parts Inc.',
      contact: 'Jane Smith',
      phone: '+1 555 987 6543',
      email: 'parts@samsungparts.com'
    },
    compatibility: [
      { brand: 'Samsung', model: 'Galaxy S21' },
      { brand: 'Samsung', model: 'Galaxy S21+' }
    ]
  }
];

const orders = [
  {
    orderNumber: 'ORD-2024-001',
    barcode: 'BC-2024-001',
    device: {
      type: 'Phone',
      brand: 'Apple',
      model: 'iPhone 12',
      serialNumber: 'SN123456789',
      condition: 'Hasarlı Ekran'
    },
    serviceType: 'Repair',
    description: 'Ekran değişimi gerekiyor',
    status: 'in_progress',
    priority: 'high',
    products: [],
    labor: {
      description: 'Ekran değişimi',
      hours: 1,
      rate: 200,
      total: 200
    },
    payment: {
      method: 'card',
      status: 'paid',
      amount: 2700,
      paidAmount: 2700,
      dueAmount: 0
    }
  },
  {
    orderNumber: 'ORD-2024-002',
    barcode: 'BC-2024-002',
    device: {
      type: 'Phone',
      brand: 'Samsung',
      model: 'Galaxy S21',
      serialNumber: 'SN987654321',
      condition: 'Batarya Şişmesi'
    },
    serviceType: 'Repair',
    description: 'Batarya değişimi gerekiyor',
    status: 'pending',
    priority: 'standard',
    products: [],
    labor: {
      description: 'Batarya değişimi',
      hours: 0.5,
      rate: 200,
      total: 100
    },
    payment: {
      method: 'pending',
      status: 'pending',
      amount: 900,
      paidAmount: 0,
      dueAmount: 900
    }
  }
];

async function seed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Branch.deleteMany({}),
      Customer.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // Create branches
    const createdBranches = await Branch.insertMany(branches);
    console.log('Created branches');

    // Create users with branch assignments
    const branchStaff = {
      email: 'staff@repairflowpro.com',
      password: 'demo123',
      name: 'Branch Staff',
      role: 'branch_staff',
      branchId: createdBranches[0]._id
    };

    const technician = {
      email: 'tech@repairflowpro.com',
      password: 'demo123',
      name: 'Technician',
      role: 'technician',
      branchId: createdBranches[0]._id
    };

    const allUsers = [...users, branchStaff, technician];
    const createdUsers = await User.insertMany(allUsers);
    console.log('Created users');

    // Create customers with branch assignments
    const customersWithBranch = customers.map(customer => ({
      ...customer,
      branchId: createdBranches[0]._id
    }));
    const createdCustomers = await Customer.insertMany(customersWithBranch);
    console.log('Created customers');

    // Create products with branch assignments
    const productsWithBranch = products.map(product => ({
      ...product,
      branchId: createdBranches[0]._id
    }));
    const createdProducts = await Product.insertMany(productsWithBranch);
    console.log('Created products');

    // Create orders with relationships
    const ordersWithRelations = orders.map((order, index) => ({
      ...order,
      customerId: createdCustomers[index]._id,
      branchId: createdBranches[0]._id,
      assignedTechnician: createdUsers.find(u => u.role === 'technician')._id,
      products: [{
        productId: createdProducts[index]._id,
        name: createdProducts[index].name,
        quantity: 1,
        price: createdProducts[index].price
      }]
    }));
    await Order.insertMany(ordersWithRelations);
    console.log('Created orders');

    console.log('Seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed(); 