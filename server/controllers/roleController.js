const Role = require('../models/Role');
const { logger } = require('../utils/logger');

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private/Admin
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      roles
    });
  } catch (error) {
    logger.error('Get roles failed', { error: error.message, userId: req.user?._id, ip: req.ip });
    res.status(500).json({
      success: false,
      message: 'Failed to get roles'
    });
  }
};

// @desc    Create new role
// @route   POST /api/roles
// @access  Private/Admin
exports.createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    // Check if role already exists
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Role with this name already exists'
      });
    }

    const role = await Role.create({
      name,
      description,
      permissions
    });

    logger.info('Role created', {
      roleId: role._id,
      createdBy: req.user._id,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      role
    });
  } catch (error) {
    logger.error('Create role failed', {
      error: error.message,
      userId: req.user?._id,
      ip: req.ip
    });
    res.status(500).json({
      success: false,
      message: 'Failed to create role'
    });
  }
};

// @desc    Update role
// @route   PUT /api/roles/:id
// @access  Private/Admin
exports.updateRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Prevent updating system roles
    if (role.isSystem) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update system role'
      });
    }

    // Check if new name conflicts with existing role
    if (name !== role.name) {
      const existingRole = await Role.findOne({ name });
      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: 'Role with this name already exists'
        });
      }
    }

    role.name = name;
    role.description = description;
    role.permissions = permissions;
    await role.save();

    logger.info('Role updated', {
      roleId: role._id,
      updatedBy: req.user._id,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      role
    });
  } catch (error) {
    logger.error('Update role failed', {
      error: error.message,
      roleId: req.params.id,
      userId: req.user?._id,
      ip: req.ip
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update role'
    });
  }
};

// @desc    Delete role
// @route   DELETE /api/roles/:id
// @access  Private/Admin
exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Prevent deleting system roles
    if (role.isSystem) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete system role'
      });
    }

    await role.deleteOne();

    logger.info('Role deleted', {
      roleId: role._id,
      deletedBy: req.user._id,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    logger.error('Delete role failed', {
      error: error.message,
      roleId: req.params.id,
      userId: req.user?._id,
      ip: req.ip
    });
    res.status(500).json({
      success: false,
      message: 'Failed to delete role'
    });
  }
};

// @desc    Toggle role active status
// @route   PUT /api/roles/:id/toggle-active
// @access  Private/Admin
exports.toggleRoleActive = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Prevent deactivating system roles
    if (role.isSystem) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate system role'
      });
    }

    role.isActive = !role.isActive;
    await role.save();

    logger.info('Role status updated', {
      roleId: role._id,
      newStatus: role.isActive ? 'active' : 'inactive',
      updatedBy: req.user._id,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: `Role ${role.isActive ? 'activated' : 'deactivated'} successfully`,
      role
    });
  } catch (error) {
    logger.error('Toggle role status failed', {
      error: error.message,
      roleId: req.params.id,
      userId: req.user?._id,
      ip: req.ip
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update role status'
    });
  }
}; 