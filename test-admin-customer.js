// Test script to verify admin user customer creation
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAdminCustomerCreation() {
  try {
    console.log('=== Testing Admin Customer Creation ===');
    
    // 1. Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@repairsystem.com',
      password: 'Admin123!'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }
    
    const token = loginResponse.data.data.accessToken;
    const user = loginResponse.data.data.user;
    console.log('✓ Login successful:', {
      id: user.id,
      email: user.email,
      role: user.role
    });
    
    // 2. Get current branch (should be null for admin)
    console.log('\n2. Getting current branch...');
    const branchResponse = await axios.get(`${API_BASE}/branches/current`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✓ Current branch response:', branchResponse.data);
    
    // 3. Get all branches
    console.log('\n3. Getting all branches...');
    const allBranchesResponse = await axios.get(`${API_BASE}/branches`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✓ All branches response:', {
      success: allBranchesResponse.data.success,
      count: allBranchesResponse.data.data?.length || 0,
      branches: allBranchesResponse.data.data?.map(b => ({ id: b._id, name: b.name, code: b.code })) || []
    });
    
    if (!allBranchesResponse.data.data || allBranchesResponse.data.data.length === 0) {
      throw new Error('No branches available for customer creation');
    }
    
    // 4. Create a customer
    console.log('\n4. Creating customer...');
    const firstBranch = allBranchesResponse.data.data[0];
    const customerData = {
      name: 'Test Customer Admin',
      email: 'testcustomer@example.com',
      phone: '5551234567',
      address: 'Test Address 123',
      branchId: firstBranch._id,
      createdBy: user.id
    };
    
    console.log('Customer data to create:', customerData);
    
    const customerResponse = await axios.post(`${API_BASE}/customers`, customerData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✓ Customer creation response:', customerResponse.data);
    
    if (customerResponse.data.success) {
      console.log('\n🎉 SUCCESS: Admin user can create customers!');
      console.log('Created customer:', {
        id: customerResponse.data.data._id,
        name: customerResponse.data.data.name,
        branchId: customerResponse.data.data.branchId
      });
    } else {
      console.log('\n❌ FAILED: Customer creation failed');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAdminCustomerCreation(); 