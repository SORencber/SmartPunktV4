const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  toggleRoleActive
} = require('../controllers/roleController');

// All routes are protected and require admin role
router.use(protect);
router.use(authorize('admin'));

// Get all roles and create new role
router.route('/')
  .get(getRoles)
  .post(createRole);

// Update and delete specific role
router.route('/:id')
  .put(updateRole)
  .delete(deleteRole);

// Toggle role active status
router.put('/:id/toggle-active', toggleRoleActive);

module.exports = router; 