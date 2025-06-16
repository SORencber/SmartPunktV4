const express = require('express');
const { protect } = require('../middleware/auth');
const {
  register,
  login,
  getMe,
  logout,
  updatePassword,
  forgotPassword,
  resetPassword,
  refreshToken
} = require('../controllers/authController');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);

// Protected routes
router.use(protect); // Tüm aşağıdaki route'lar için auth gerekli
router.get('/me', getMe);
router.post('/logout', logout);
router.put('/update-password', updatePassword);

module.exports = router;