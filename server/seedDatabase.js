const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Branch = require('./models/Branch');
const Customer = require('./models/Customer');
const Order = require('./models/Order');
const Product = require('./models/Product');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Branch.deleteMany({});
    await Customer.deleteMany({});
    await Order.deleteMany({});
    await Product.deleteMany({});
    console.log('✅ Existing data cleared');

    // 1. Create Branches
    console.log('🏢 Creating branches...');
    const branches = await Branch.insertMany([
      {
        name: 'Downtown Repair Center',
        address: {
          street: '123 Main St',
          city: 'Downtown',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        phone: '+1 (555) 123-4567',
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
        services: ['Phone Repair', 'Tablet Repair', 'Laptop Repair', 'Data Recovery']
      },
      {
        name: 'Uptown Service Hub',
        address: {
          street: '456 Broadway',
          city: 'Uptown',
          state: 'NY',
          zipCode: '10002',
          country: 'USA'
        },
        phone: '+1 (555) 987-6543',
        email: 'uptown@repairflowpro.com',
        manager: 'Jane Doe',
        isActive: true,
        openingHours: {
          monday: { open: '08:00', close: '19:00' },
          tuesday: { open: '08:00', close: '19:00' },
          wednesday: { open: '08:00', close: '19:00' },
          thursday: { open: '08:00', close: '19:00' },
          friday: { open: '08:00', close: '19:00' },
          saturday: { open: '09:00', close: '17:00' },
          sunday: { open: '10:00', close: '15:00' }
        },
        services: ['Phone Repair', 'Computer Repair', 'Console Repair', 'Screen Replacement']
      },
      {
        name: 'Central Tech Center',
        address: {
          street: '789 Central Ave',
          city: 'Midtown',
          state: 'NY',
          zipCode: '10003',
          country: 'USA'
        },
        phone: '+1 (555) 456-7890',
        email: 'central@repairflowpro.com',
        manager: 'Mike Johnson',
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
        services: ['All Device Repairs', 'Data Recovery', 'Hardware Upgrades']
      }
    ]);
    console.log(`✅ Created ${branches.length} branches`);

    // 2. Create Users
    console.log('👥 Creating users...');
    const users = await User.insertMany([
      {
        name: 'System Administrator',
        email: 'admin@repairflowpro.com',
        password: 'demo123',
        role: 'admin',
        isActive: true,
        branchId: null, // Admin doesn't belong to specific branch
        permissions: ['all'],
        lastLogin: new Date()
      },
      {
        name: 'Headquarters Manager',
        email: 'hq@repairflowpro.com',
        password: 'demo123',
        role: 'headquarters',
        isActive: true,
        branchId: null, // HQ has access to all branches
        permissions: ['view_all_orders', 'generate_barcodes', 'view_reports'],
        lastLogin: new Date()
      },
      {
        name: 'Downtown Branch Manager',
        email: 'staff@repairflowpro.com',
        password: 'demo123',
        role: 'branch_staff',
        isActive: true,
        branchId: branches[0]._id, // Downtown branch
        permissions: ['manage_orders', 'manage_customers', 'manage_inventory'],
        lastLogin: new Date()
      },
      {
        name: 'Senior Technician',
        email: 'tech@repairflowpro.com',
        password: 'demo123',
        role: 'technician',
        isActive: true,
        branchId: branches[0]._id, // Downtown branch
        permissions: ['view_assigned_orders', 'update_order_status'],
        lastLogin: new Date()
      },
      {
        name: 'Uptown Manager',
        email: 'uptown@repairflowpro.com',
        password: 'demo123',
        role: 'branch_staff',
        isActive: true,
        branchId: branches[1]._id, // Uptown branch
        permissions: ['manage_orders', 'manage_customers', 'manage_inventory'],
        lastLogin: new Date()
      }
    ]);
    console.log(`✅ Created ${users.length} users`);

    // 3. Create Customers
    console.log('👤 Creating customers...');
    const customers = await Customer.insertMany([
      {
        name: 'John Doe',
        email: 'john.doe@email.com',
        phone: '+1 (555) 111-2222',
        address: {
          street: '123 Customer St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        branchId: branches[0]._id,
        language: 'en',
        totalOrders: 0,
        totalSpent: 0,
        notes: 'Regular customer, prefers morning appointments'
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@email.com',
        phone: '+1 (555) 333-4444',
        address: {
          street: '456 Client Ave',
          city: 'New York',
          state: 'NY',
          zipCode: '10002',
          country: 'USA'
        },
        branchId: branches[0]._id,
        language: 'en',
        totalOrders: 0,
        totalSpent: 0,
        notes: 'Business customer, owns multiple devices'
      },
      {
        name: 'Bob Johnson',
        email: 'bob.johnson@email.com',
        phone: '+1 (555) 555-6666',
        address: {
          street: '789 User Blvd',
          city: 'New York',
          state: 'NY',
          zipCode: '10003',
          country: 'USA'
        },
        branchId: branches[1]._id,
        language: 'en',
        totalOrders: 0,
        totalSpent: 0,
        notes: 'Tech enthusiast, familiar with repair processes'
      },
      {
        name: 'Maria Garcia',
        email: 'maria.garcia@email.com',
        phone: '+1 (555) 777-8888',
        address: {
          street: '321 Cliente Rd',
          city: 'New York',
          state: 'NY',
          zipCode: '10004',
          country: 'USA'
        },
        branchId: branches[1]._id,
        language: 'es',
        totalOrders: 0,
        totalSpent: 0,
        notes: 'Prefers Spanish communication'
      },
      {
        name: 'Ahmed Hassan',
        email: 'ahmed.hassan@email.com',
        phone: '+1 (555) 999-0000',
        address: {
          street: '654 Tech St',
          city: 'New York',
          state: 'NY',
          zipCode: '10005',
          country: 'USA'
        },
        branchId: branches[2]._id,
        language: 'en',
        totalOrders: 0,
        totalSpent: 0,
        notes: 'Software engineer, very tech-savvy'
      }
    ]);
    console.log(`✅ Created ${customers.length} customers`);

    // 4. Create Products
    console.log('📱 Creating products...');
    const products = await Product.insertMany([
      // iPhone Parts
      {
        name: 'iPhone 14 Pro Screen',
        sku: 'IPH14P-SCR-001',
        category: 'Screen',
        description: 'Original quality iPhone 14 Pro OLED display assembly',
        price: 299.99,
        cost: 180.00,
        stock: 25,
        minStock: 5,
        branchId: branches[0]._id,
        compatibility: {
          brand: 'Apple',
          model: 'iPhone 14 Pro',
          type: 'Phone'
        },
        supplier: 'Apple Authorized Distributor',
        warrantyEligible: true,
        isActive: true
      },
      {
        name: 'iPhone 13 Battery',
        sku: 'IPH13-BAT-001',
        category: 'Battery',
        description: 'High capacity replacement battery for iPhone 13',
        price: 89.99,
        cost: 45.00,
        stock: 40,
        minStock: 10,
        branchId: branches[0]._id,
        compatibility: {
          brand: 'Apple',
          model: 'iPhone 13',
          type: 'Phone'
        },
        supplier: 'PowerCell Inc',
        warrantyEligible: true,
        isActive: true
      },
      // Samsung Parts
      {
        name: 'Samsung Galaxy S23 Screen',
        sku: 'SAM-S23-SCR-001',
        category: 'Screen',
        description: 'AMOLED display assembly for Samsung Galaxy S23',
        price: 249.99,
        cost: 150.00,
        stock: 15,
        minStock: 3,
        branchId: branches[0]._id,
        compatibility: {
          brand: 'Samsung',
          model: 'Galaxy S23',
          type: 'Phone'
        },
        supplier: 'Samsung Parts Direct',
        warrantyEligible: true,
        isActive: true
      },
      // MacBook Parts
      {
        name: 'MacBook Pro 13" M2 Keyboard',
        sku: 'MBP13M2-KB-001',
        category: 'Keyboard',
        description: 'Complete keyboard assembly for MacBook Pro 13" M2',
        price: 199.99,
        cost: 120.00,
        stock: 8,
        minStock: 2,
        branchId: branches[1]._id,
        compatibility: {
          brand: 'Apple',
          model: 'MacBook Pro 13" M2',
          type: 'Laptop'
        },
        supplier: 'Mac Repair Solutions',
        warrantyEligible: true,
        isActive: true
      },
      // iPad Parts
      {
        name: 'iPad Air 5th Gen Screen',
        sku: 'IPADAIR5-SCR-001',
        category: 'Screen',
        description: 'Touch screen digitizer for iPad Air 5th generation',
        price: 179.99,
        cost: 100.00,
        stock: 12,
        minStock: 3,
        branchId: branches[1]._id,
        compatibility: {
          brand: 'Apple',
          model: 'iPad Air 5th Gen',
          type: 'Tablet'
        },
        supplier: 'Tablet Parts Pro',
        warrantyEligible: true,
        isActive: true
      },
      // Tools and Accessories
      {
        name: 'Professional Repair Tool Kit',
        sku: 'TOOL-KIT-PRO-001',
        category: 'Tools',
        description: 'Complete screwdriver and prying tool set for device repair',
        price: 49.99,
        cost: 25.00,
        stock: 20,
        minStock: 5,
        branchId: branches[2]._id,
        compatibility: {
          brand: 'Universal',
          model: 'All Devices',
          type: 'Tool'
        },
        supplier: 'iFixit',
        warrantyEligible: false,
        isActive: true
      }
    ]);
    console.log(`✅ Created ${products.length} products`);

    // 5. Create Orders
    console.log('📋 Creating orders...');
    const orders = [];
    
    // Order 1 - Completed iPhone repair
    orders.push(new Order({
      orderNumber: 'ORD-2024-001',
      barcode: 'RF12345678',
      customerId: customers[0]._id,
      branchId: branches[0]._id,
      device: {
        type: 'Phone',
        brand: 'Apple',
        model: 'iPhone 14 Pro',
        serialNumber: 'F2LLD8H3H7',
        condition: 'Cracked screen, device boots normally'
      },
      serviceType: 'Repair',
      description: 'Screen replacement for iPhone 14 Pro with cracked display',
      status: 'completed',
      priority: 'standard',
      assignedTechnician: users[3]._id, // Technician
      products: [{
        productId: products[0]._id,
        name: products[0].name,
        quantity: 1,
        price: products[0].price
      }],
      labor: {
        description: 'Screen replacement service',
        hours: 1.5,
        rate: 60.00,
        total: 90.00
      },
      estimatedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000),
      actualCompletion: new Date(),
      payment: {
        method: 'card',
        status: 'paid',
        amount: 389.99,
        paidAmount: 389.99,
        dueAmount: 0
      },
      statusHistory: [
        {
          status: 'pending',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          user: users[2]._id,
          notes: 'Order created'
        },
        {
          status: 'in_progress',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          user: users[3]._id,
          notes: 'Started screen replacement'
        },
        {
          status: 'completed',
          date: new Date(),
          user: users[3]._id,
          notes: 'Screen replacement completed successfully'
        }
      ],
      warranty: {
        isEnabled: true,
        period: 180,
        startDate: new Date(),
        endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
      },
      notes: {
        internal: 'Customer very satisfied with service',
        customer: 'Great service, fast turnaround time!'
      }
    }));

    // Order 2 - In progress Samsung repair
    orders.push(new Order({
      orderNumber: 'ORD-2024-002',
      barcode: 'RF87654321',
      customerId: customers[1]._id,
      branchId: branches[0]._id,
      device: {
        type: 'Phone',
        brand: 'Samsung',
        model: 'Galaxy S23',
        serialNumber: 'R58NW4H2C9L',
        condition: 'Black screen, device vibrates when powered on'
      },
      serviceType: 'Repair',
      description: 'Display replacement for Samsung Galaxy S23',
      status: 'in_progress',
      priority: 'high',
      assignedTechnician: users[3]._id,
      products: [{
        productId: products[2]._id,
        name: products[2].name,
        quantity: 1,
        price: products[2].price
      }],
      labor: {
        description: 'Display replacement and testing',
        hours: 2.0,
        rate: 60.00,
        total: 120.00
      },
      estimatedCompletion: new Date(Date.now() + 12 * 60 * 60 * 1000),
      payment: {
        method: 'cash',
        status: 'partial',
        amount: 369.99,
        paidAmount: 200.00,
        dueAmount: 169.99
      },
      statusHistory: [
        {
          status: 'pending',
          date: new Date(Date.now() - 12 * 60 * 60 * 1000),
          user: users[2]._id,
          notes: 'Order received'
        },
        {
          status: 'in_progress',
          date: new Date(Date.now() - 6 * 60 * 60 * 1000),
          user: users[3]._id,
          notes: 'Diagnostics completed, screen replacement in progress'
        }
      ],
      warranty: {
        isEnabled: true,
        period: 180
      }
    }));

    // Order 3 - Pending MacBook repair
    orders.push(new Order({
      orderNumber: 'ORD-2024-003',
      barcode: 'RF11223344',
      customerId: customers[2]._id,
      branchId: branches[1]._id,
      device: {
        type: 'Laptop',
        brand: 'Apple',
        model: 'MacBook Pro 13" M2',
        serialNumber: 'FVFM2LL4A',
        condition: 'Several keys not responding, coffee spill damage'
      },
      serviceType: 'Repair',
      description: 'Keyboard replacement due to liquid damage',
      status: 'pending',
      priority: 'standard',
      products: [{
        productId: products[3]._id,
        name: products[3].name,
        quantity: 1,
        price: products[3].price
      }],
      labor: {
        description: 'Keyboard replacement and cleaning',
        hours: 3.0,
        rate: 75.00,
        total: 225.00
      },
      estimatedCompletion: new Date(Date.now() + 48 * 60 * 60 * 1000),
      payment: {
        method: 'pending',
        status: 'pending',
        amount: 424.99,
        paidAmount: 0,
        dueAmount: 424.99
      },
      statusHistory: [
        {
          status: 'pending',
          date: new Date(Date.now() - 2 * 60 * 60 * 1000),
          user: users[4]._id, // Uptown manager
          notes: 'Order created, waiting for parts'
        }
      ],
      warranty: {
        isEnabled: true,
        period: 180
      }
    }));

    // Order 4 - Delivered iPad repair
    orders.push(new Order({
      orderNumber: 'ORD-2024-004',
      barcode: 'RF99887766',
      customerId: customers[3]._id,
      branchId: branches[1]._id,
      device: {
        type: 'Tablet',
        brand: 'Apple',
        model: 'iPad Air 5th Gen',
        serialNumber: 'DMPL25GHQR',
        condition: 'Touch screen not responsive in certain areas'
      },
      serviceType: 'Repair',
      description: 'Touch screen digitizer replacement',
      status: 'delivered',
      priority: 'standard',
      products: [{
        productId: products[4]._id,
        name: products[4].name,
        quantity: 1,
        price: products[4].price
      }],
      labor: {
        description: 'Digitizer replacement and calibration',
        hours: 2.5,
        rate: 70.00,
        total: 175.00
      },
      estimatedCompletion: new Date(Date.now() - 6 * 60 * 60 * 1000),
      actualCompletion: new Date(Date.now() - 2 * 60 * 60 * 1000),
      payment: {
        method: 'card',
        status: 'paid',
        amount: 354.99,
        paidAmount: 354.99,
        dueAmount: 0
      },
      statusHistory: [
        {
          status: 'pending',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          user: users[4]._id,
          notes: 'Order received'
        },
        {
          status: 'in_progress',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          user: users[4]._id,
          notes: 'Digitizer replacement started'
        },
        {
          status: 'completed',
          date: new Date(Date.now() - 6 * 60 * 60 * 1000),
          user: users[4]._id,
          notes: 'Repair completed, device tested'
        },
        {
          status: 'delivered',
          date: new Date(Date.now() - 2 * 60 * 60 * 1000),
          user: users[4]._id,
          notes: 'Device delivered to customer'
        }
      ],
      warranty: {
        isEnabled: true,
        period: 180,
        startDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 178 * 24 * 60 * 60 * 1000)
      }
    }));

    await Order.insertMany(orders);
    console.log(`✅ Created ${orders.length} orders`);

    // 6. Update customer statistics
    console.log('📊 Updating customer statistics...');
    for (const customer of customers) {
      const customerOrders = orders.filter(order => 
        order.customerId.toString() === customer._id.toString()
      );
      
      const totalSpent = customerOrders.reduce((sum, order) => 
        sum + order.payment.amount, 0
      );
      
      await Customer.findByIdAndUpdate(customer._id, {
        totalOrders: customerOrders.length,
        totalSpent: totalSpent
      });
    }
    console.log('✅ Customer statistics updated');

    // 7. Update product stock (simulate usage)
    console.log('📦 Updating product stock...');
    for (const order of orders) {
      for (const product of order.products) {
        await Product.findByIdAndUpdate(product.productId, {
          $inc: { stock: -product.quantity }
        });
      }
    }
    console.log('✅ Product stock updated');

    console.log('\n🎉 DATABASE SEEDING COMPLETED!');
    console.log('=====================================');
    console.log(`✅ Branches: ${branches.length}`);
    console.log(`✅ Users: ${users.length}`);
    console.log(`✅ Customers: ${customers.length}`);
    console.log(`✅ Products: ${products.length}`);
    console.log(`✅ Orders: ${orders.length}`);
    console.log('\n🔑 Demo Accounts:');
    console.log('- admin@repairflowpro.com / demo123 (Admin)');
    console.log('- hq@repairflowpro.com / demo123 (Headquarters)');
    console.log('- staff@repairflowpro.com / demo123 (Branch Staff)');
    console.log('- tech@repairflowpro.com / demo123 (Technician)');
    console.log('- uptown@repairflowpro.com / demo123 (Uptown Manager)');
    console.log('\n🚀 Ready for testing with real MongoDB data!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the seeding
seedDatabase();
