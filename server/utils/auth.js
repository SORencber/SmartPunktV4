const jwt = require('jsonwebtoken');
const { authLogger } = require('./logger');

// Generate access token
const generateAccessToken = (userId, role) => {
  try {
    return jwt.sign(
      { userId, role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '15m' }
    );
  } catch (error) {
    authLogger.error('Error generating access token', error);
    throw error;
  }
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  try {
    return jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      { expiresIn: '7d' }
    );
  } catch (error) {
    authLogger.error('Error generating refresh token', error);
    throw error;
  }
};

// Verify access token
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      authLogger.info('Access token expired', { token });
      throw new Error('Token expired');
    }
    authLogger.error('Error verifying access token', error);
    throw new Error('Invalid token');
  }
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key');
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      authLogger.info('Refresh token expired', { token });
      throw new Error('Refresh token expired');
    }
    authLogger.error('Error verifying refresh token', error);
    throw new Error('Invalid refresh token');
  }
};

// Generate password hash
const generatePasswordHash = async (password) => {
  try {
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  } catch (error) {
    authLogger.error('Error generating password hash', error);
    throw error;
  }
};

// Compare password with hash
const comparePassword = async (password, hash) => {
  try {
    const bcrypt = require('bcryptjs');
    return bcrypt.compare(password, hash);
  } catch (error) {
    authLogger.error('Error comparing password', error);
    throw error;
  }
};

// Generate random password
const generateRandomPassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generatePasswordHash,
  comparePassword,
  generateRandomPassword
};
