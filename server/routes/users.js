const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getUsers, toggleUserActive, updateUser, deleteUser, getUserById } = require('../controllers/userController');

// All routes are protected and require admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/', getUsers);
router.put('/:id/toggle-active', toggleUserActive);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.get('/:id', getUserById);

module.exports = router; 