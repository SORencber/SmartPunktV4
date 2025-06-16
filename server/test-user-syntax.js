// Test script to check if User.js has syntax errors
try {
  console.log('Testing User.js syntax...');
  require('./models/User');
  console.log('✅ User.js has valid syntax');
} catch (error) {
  console.log('❌ User.js has syntax error:', error.message);
  console.log('Stack:', error.stack);
}
