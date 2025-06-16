const Branch = require('../models/Branch');
const User = require('../models/User');
const { AppError } = require('../middleware/error');
const { logger } = require('../utils/logger');

// @desc    Get current user's branch
// @route   GET /api/branches/current
// @access  Private
exports.getCurrentBranch = async (req, res, next) => {
  try {
    let branchId = req.user.branch;
    // Eğer branch bir nesne ise ve $oid varsa, onu kullan
    if (branchId && typeof branchId === 'object' && branchId.$oid) {
      branchId = branchId.$oid;
    }
    // Eğer branch bir nesne ise ve _id varsa, onu kullan
    if (branchId && typeof branchId === 'object' && branchId._id) {
      branchId = branchId._id;
    }
    if (!branchId) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No branch assigned to user'
      });
    }
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'Branch not found'
      });
    }
    res.status(200).json({
      success: true,
      data: {
        _id: branch._id,
        id: branch._id,
        name: branch.name,
        code: branch.code,
        address: branch.address,
        phone: branch.phone,
        managerName: branch.managerName,
        isCentral: branch.isCentral,
        status: branch.status
      }
    });
  } catch (error) {
    logger.error(`Get current branch error: ${error.message}`, {
      userId: req.user._id,
      role: req.user.role,
      branchId: req.user.branch
    });
    next(error);
  }
};

// @desc    Get all branches
// @route   GET /api/branches
// @access  Private (Admin, Central Staff)
exports.getAllBranches = async (req, res, next) => {
  try {
    const branches = await Branch.find();
    res.status(200).json({
      success: true,
      data: branches
    });
  } catch (error) {
    logger.error(`Get all branches error: ${error.message}`);
    next(error);
  }
};

// @desc    Get single branch
// @route   GET /api/branches/:id
// @access  Private (Admin, Central Staff, Branch Staff of that branch)
exports.getBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return next(new AppError('Branch not found', 404));
    }

    // Check if user has access to this branch
    if (req.user.role !== 'admin' && 
        req.user.role !== 'central_staff' && 
        req.user.branch.toString() !== req.params.id) {
      return next(new AppError('Not authorized to access this branch', 403));
    }

    res.status(200).json({
      success: true,
      data: branch
    });
  } catch (error) {
    logger.error(`Get branch error: ${error.message}`);
    next(error);
  }
};

// @desc    Create new branch
// @route   POST /api/branches
// @access  Private (Admin only)
exports.createBranch = async (req, res, next) => {
  try {
    console.log('Create branch request received:', {
      user: req.user,
      body: req.body
    });

    if (req.user.role !== 'admin') {
      console.log('Unauthorized branch creation attempt:', {
        userId: req.user.id,
        userRole: req.user.role
      });
      return next(new AppError('Not authorized to create branches', 403));
    }

    // Format address data
    const branchData = {
      ...req.body,
      address: {
        street: typeof req.body.address === 'string' ? req.body.address : (req.body.address?.street || ''),
        city: typeof req.body.address === 'string' ? '' : (req.body.address?.city || ''),
        state: typeof req.body.address === 'string' ? '' : (req.body.address?.state || ''),
        country: typeof req.body.address === 'string' ? '' : (req.body.address?.country || ''),
        postalCode: typeof req.body.address === 'string' ? '' : (req.body.address?.postalCode || '')
      }
    };

    console.log('Creating new branch with data:', branchData);
    const branch = await Branch.create(branchData);
    console.log('Branch created successfully:', branch);

    res.status(201).json({
      success: true,
      data: branch
    });
  } catch (error) {
    console.error('Create branch error:', {
      error: error.message,
      stack: error.stack,
      validationErrors: error.errors
    });
    logger.error(`Create branch error: ${error.message}`);
    next(error);
  }
};

// @desc    Update branch
// @route   PUT /api/branches/:id
// @access  Private (Admin only)
exports.updateBranch = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return next(new AppError('Not authorized to update branches', 403));
    }

    // Format address data
    const branchData = {
      ...req.body,
      address: {
        street: typeof req.body.address === 'string' ? req.body.address : (req.body.address?.street || ''),
        city: typeof req.body.address === 'string' ? '' : (req.body.address?.city || ''),
        state: typeof req.body.address === 'string' ? '' : (req.body.address?.state || ''),
        country: typeof req.body.address === 'string' ? '' : (req.body.address?.country || ''),
        postalCode: typeof req.body.address === 'string' ? '' : (req.body.address?.postalCode || '')
      }
    };

    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      branchData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!branch) {
      return next(new AppError('Branch not found', 404));
    }

    res.status(200).json({
      success: true,
      data: branch
    });
  } catch (error) {
    logger.error(`Update branch error: ${error.message}`);
    next(error);
  }
};

// @desc    Delete branch
// @route   DELETE /api/branches/:id
// @access  Private (Admin only)
exports.deleteBranch = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return next(new AppError('Not authorized to delete branches', 403));
    }

    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return next(new AppError('Branch not found', 404));
    }

    // Delete all non-admin users associated with this branch
    const deleteResult = await User.deleteMany({
      branch: req.params.id,
      role: { $ne: 'admin' } // Don't delete admin users
    });

    logger.info(`Deleted ${deleteResult.deletedCount} users from branch ${req.params.id}`);

    // Now delete the branch
    await Branch.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {
        deletedUsersCount: deleteResult.deletedCount,
        message: `Branch deleted successfully along with ${deleteResult.deletedCount} associated users`
      }
    });
  } catch (error) {
    logger.error(`Delete branch error: ${error.message}`);
    next(error);
  }
}; 