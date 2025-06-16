// Comprehensive diagnostic script
console.log('=== DIAGNOSTIC INFORMATION ===');
console.log('Current working directory:', process.cwd());
console.log('Node.js version:', process.version);
console.log('Script location:', __filename);
console.log('Script directory:', __dirname);

// Test module resolution
const path = require('path');
const fs = require('fs');

console.log('\n=== TESTING MODULE PATHS ===');

// Check if models directory exists
const modelsDir = path.join(__dirname, 'models');
console.log('Models directory path:', modelsDir);
console.log('Models directory exists:', fs.existsSync(modelsDir));

// Check if User.js exists
const userPath = path.join(__dirname, 'models', 'User.js');
console.log('User.js path:', userPath);
console.log('User.js exists:', fs.existsSync(userPath));

// Test require from auth middleware perspective
const authDir = path.join(__dirname, 'routes', 'middleware');
console.log('Auth middleware directory:', authDir);
console.log('Auth middleware directory exists:', fs.existsSync(authDir));

// Test the relative path that should work
const relativeUserPath = path.resolve(authDir, '../../models/User.js');
console.log('Resolved User path from auth middleware:', relativeUserPath);
console.log('Resolved path exists:', fs.existsSync(relativeUserPath));

console.log('\n=== TESTING ACTUAL REQUIRE ===');
try {
  const User = require('./models/User');
  console.log('✅ Successfully required User model');
  console.log('User model type:', typeof User);
  console.log('User model name:', User.modelName || 'unknown');
} catch (error) {
  console.log('❌ Failed to require User model:', error.message);
}
