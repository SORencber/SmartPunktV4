const User = require('../models/User');
const { logger } = require('../utils/logger');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('branch');
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    logger.error('Get users failed', { error: error.message, userId: req.user?._id, ip: req.ip });
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
};

// @desc    Toggle user active status
// @route   PUT /api/users/:id/toggle-active
// @access  Private/Admin
exports.toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deactivating self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    // Toggle between active and inactive
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    user.status = newStatus;
    await user.save();

    logger.info('User status updated', {
      userId: user._id,
      newStatus: user.status,
      updatedBy: req.user._id,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
      user: {
        _id: user._id,
        status: user.status
      }
    });
  } catch (error) {
    logger.error('Toggle user status failed', {
      error: error.message,
      userId: req.params.id,
      updatedBy: req.user?._id,
      ip: req.ip
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { fullName, email, phone, role, branch } = req.body;

    // Find user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it's already taken
    if (email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    // Update user
    user.fullName = fullName;
    user.email = email;
    user.phone = phone;
    user.role = role;
    user.branch = branch;

    await user.save();

    logger.info('User updated', {
      userId: user._id,
      updatedBy: req.user._id,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    logger.error('Update user failed', {
      error: error.message,
      userId: req.params.id,
      updatedBy: req.user?._id,
      ip: req.ip
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await user.deleteOne();

    logger.info('User deleted', {
      userId: user._id,
      deletedBy: req.user._id,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Delete user failed', {
      error: error.message,
      userId: req.params.id,
      deletedBy: req.user?._id,
      ip: req.ip
    });
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
}; 

// @desc    Get user by id
// @route   GET /api/users/:id
// @access  Private (kendi bilgisi veya admin)
exports.getUserById = async (req, res) => {
  try {
    // Sadece kendi bilgisi veya admin ise erişim izni
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Yetkisiz erişim'
      });
    }
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('branch');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    logger.error('Get user by id failed', { error: error.message, userId: req.params.id, ip: req.ip });
    res.status(500).json({
      success: false,
      message: 'Kullanıcı bilgisi alınamadı'
    });
  }
}; 