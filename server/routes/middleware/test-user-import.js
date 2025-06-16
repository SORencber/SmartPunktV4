// Simple test to verify the User model can be required
try {
  console.log('Testing User model import...');
  const User = require('../../models/User');
  console.log('✅ Successfully imported User model');
  console.log('Model name:', User.modelName);
} catch (error) {
  console.log('❌ Failed to import User model:', error.message);
  console.log('Stack trace:', error.stack);
}
