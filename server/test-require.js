// Test script to verify module resolution
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

try {
  // Test requiring the User model from the same directory structure as auth.js
  const User = require('./models/User');
  console.log('✅ Successfully required User model from server directory');
  console.log('User model:', typeof User);
} catch (error) {
  console.log('❌ Failed to require User model from server directory:', error.message);
}

try {
  // Test requiring from the auth middleware perspective
  const path = require('path');
  const authDir = path.join(__dirname, 'routes', 'middleware');
  process.chdir(authDir);
  console.log('Changed to auth middleware directory:', process.cwd());
  
  const User = require('../../models/User');
  console.log('✅ Successfully required User model from auth middleware directory');
} catch (error) {
  console.log('❌ Failed to require User model from auth middleware directory:', error.message);
}
