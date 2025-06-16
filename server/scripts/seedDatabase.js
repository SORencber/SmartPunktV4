const mongoose = require('mongoose');
const User = require('../models/User');
const Branch = require('../models/Branch');
require('dotenv').config();

// Mock branches data
const mockBranches = [
  {
    name: "Headquarters",
    address: {
      street: "123 Main Street",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "USA"
    },
    phone: "+1 (555) 123-4567",
    email: "headquarters@repair.com",
    manager: "John Smith",
    openingHours: {
      monday: { open: "09:00", close: "18:00" },
      tuesday: { open: "09:00", close: "18:00" },
      wednesday: { open: "09:00", close: "18:00" },
      thursday: { open: "09:00", close: "18:00" },
      friday: { open: "09:00", close: "18:00" },
      saturday: { open: "10:00", close: "16:00" },
      sunday: { open: "10:00", close: "14:00" }
    },
    services: ["Screen Repair", "Battery Replacement", "Data Recovery", "Software Updates"],
    isActive: true
  },
  {
    name: "Downtown Branch",
    address: {
      street: "456 Broadway",
      city: "New York",
      state: "NY",
      zipCode: "10002",
      country: "USA"
    },
    phone: "+1 (555) 987-6543",
    email: "downtown@repair.com",
    manager: "Sarah Johnson",
    openingHours: {
      monday: { open: "09:00", close: "18:00" },
      tuesday: { open: "09:00", close: "18:00" },
      wednesday: { open: "09:00", close: "18:00" },
      thursday: { open: "09:00", close: "18:00" },
      friday: { open: "09:00", close: "18:00" },
      saturday: { open: "10:00", close: "16:00" },
      sunday: { open: "10:00", close: "14:00" }
    },
    services: ["Screen Repair", "Battery Replacement", "Water Damage Repair"],
    isActive: true
  }
];

// Mock users data
const mockUsers = [
  {
    email: "admin@repair.com",
    password: "Admin123!",
    name: "System Administrator",
    role: "admin",
    isActive: true
  },
  {
    email: "headquarters@repair.com",
    password: "HQ123!",
    name: "John Smith",
    role: "headquarters",
    isActive: true
  },
  {
    email: "downtown.manager@repair.com",
    password: "Branch123!",
    name: "Sarah Johnson",
    role: "branch_staff",
    isActive: true
  },
  {
    email: "downtown.tech1@repair.com",
    password: "Tech123!",
    name: "Mike Wilson",
    role: "technician",
    isActive: true
  },
  {
    email: "downtown.tech2@repair.com",
    password: "Tech123!",
    name: "Lisa Brown",
    role: "technician",
    isActive: true
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/repair-system');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Branch.deleteMany({});
    console.log('Cleared existing data');

    // Insert branches
    const branches = await Branch.insertMany(mockBranches);
    console.log('Inserted branches');

    // Update user branchId based on role
    const headquartersBranch = branches.find(b => b.name === "Headquarters");
    const downtownBranch = branches.find(b => b.name === "Downtown Branch");

    const usersWithBranch = mockUsers.map(user => {
      const userData = { ...user };
      
      // Assign branchId based on role and email
      if (user.role === 'branch_staff' || user.role === 'technician') {
        if (user.email.includes('downtown')) {
          userData.branchId = downtownBranch._id;
        } else if (user.email.includes('headquarters')) {
          userData.branchId = headquartersBranch._id;
        }
      }
      
      return userData;
    });

    // Insert users
    await User.insertMany(usersWithBranch);
    console.log('Inserted users');

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase(); 