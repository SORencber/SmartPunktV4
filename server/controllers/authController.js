const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { AppError } = require('../middleware/error');
const { logger } = require('../utils/logger');

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      permissions: user.permissions,
      branchId: user.branch ? (user.branch._id || user.branch) : null,
      branch: user.branch ? {
        id: user.branch._id || user.branch,
        name: user.branch.name,
        code: user.branch.code,
        isCentral: user.branch.isCentral,
        status: user.branch.status
      } : null,
      email: user.email,
      username: user.username,
      fullName: user.fullName
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Generate Refresh Token
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, fullName, role, branch, preferredLanguage } = req.body;

    // Validate required fields
    if (!username || !email || !password || !fullName) {
      return next(new AppError('Please provide all required fields', 400));
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(new AppError('Please provide a valid email address', 400));
    }

    // Validate password strength
    if (password.length < 8) {
      return next(new AppError('Password must be at least 8 characters long', 400));
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      logger.warn('Registration attempt with existing credentials', {
        email,
        username,
        ip: req.ip
      });
      return next(new AppError('Email or username already exists', 400));
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      fullName,
      role: role || 'staff',
      branch,
      preferredLanguage: preferredLanguage || process.env.DEFAULT_LANGUAGE,
      status: 'active',
      permissions: []
    });

    logger.info('New user registered', {
      userId: user._id,
      username: user.username,
      role: user.role,
      ip: req.ip
    });

    // Generate tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user._id);

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      success: true,
      data: {
        user,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Registration failed', {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack
      },
      requestBody: {
        username: req.body.username,
        email: req.body.email,
        role: req.body.role
      },
      ip: req.ip
    });
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    logger.info('Login attempt', {
      username: username || 'missing',
      email: email || 'missing',
      ip: req.ip
    });

    // Validate input
    if ((!username && !email) || !password) {
      logger.warn('Login attempt with missing credentials', {
        username: username || 'missing',
        email: email || 'missing',
        ip: req.ip
      });
      return next(new AppError('Please provide (username or email) and password', 400));
    }

    // Find user and include password for comparison
    const user = await User.findOne({ 
      $or: [{ username: username || null }, { email: email || null }] 
    })
    .select('+password')
    .populate({
      path: 'branch',
      select: 'name code address phone managerName isCentral status'
    });

    // Check if user exists
    if (!user) {
      logger.warn('Login attempt with non-existent user', {
        username: username || 'missing',
        email: email || 'missing',
        ip: req.ip
      });
      return next(new AppError('Invalid credentials', 401));
    }

    // Check if user is active
    if (user.status !== 'active') {
      logger.warn('Login attempt with inactive user', {
        userId: user._id,
        username: user.username,
        email: user.email,
        ip: req.ip
      });
      return next(new AppError('Your account is not active. Please contact administrator.', 401));
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn('Login attempt with invalid password', {
        userId: user._id,
        username: user.username,
        email: user.email,
        ip: req.ip
      });
      return next(new AppError('Invalid credentials', 401));
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // Generate tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user._id);

    // Remove password from response
    user.password = undefined;

    // Format user data for response
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      branchId: user.branch ? user.branch._id : null,
      branch: user.branch ? {
        id: user.branch._id,
        name: user.branch.name,
        code: user.branch.code,
        address: user.branch.address,
        phone: user.branch.phone,
        managerName: user.branch.managerName,
        isCentral: user.branch.isCentral,
        status: user.branch.status
      } : null,
      permissions: user.permissions,
      preferredLanguage: user.preferredLanguage,
      status: user.status,
      lastLogin: user.lastLogin
    };

    logger.info('User logged in successfully', {
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      branchId: user.branch?._id,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        user: userData,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Login failed', {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack
      },
      username: req.body.username,
      email: req.body.email,
      ip: req.ip
    });
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate({
        path: 'branch',
        select: 'name code address phone managerName isCentral status'
      });
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (user.status !== 'active') {
      return next(new AppError('User account is inactive', 401));
    }

    // Format user data for response
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      branchId: user.branch ? user.branch._id : null,
      branch: user.branch ? {
        id: user.branch._id,
        name: user.branch.name,
        code: user.branch.code,
        address: user.branch.address,
        phone: user.branch.phone,
        managerName: user.branch.managerName,
        isCentral: user.branch.isCentral,
        status: user.branch.status
      } : null,
      permissions: user.permissions,
      preferredLanguage: user.preferredLanguage,
      status: user.status,
      lastLogin: user.lastLogin
    };

    res.status(200).json({
      success: true,
      data: userData
    });
  } catch (error) {
    logger.error('GetMe failed', {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack
      },
      userId: req.user?.id,
      ip: req.ip
    });
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new AppError('Current password is incorrect', 401));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Generate new token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token
    });
  } catch (error) {
    logger.error('Update password error', {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack
      },
      userId: req.user.id,
      ip: req.ip
    });
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError('No user found with that email', 404));
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // TODO: Send reset email
    // For now, just return the token (in production, send via email)
    res.status(200).json({
      success: true,
      message: 'Password reset token generated',
      resetToken // Remove this in production
    });
  } catch (error) {
    logger.error('Forgot password error', {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack
      },
      email: req.body.email,
      ip: req.ip
    });
    next(error);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { resetToken } = req.params;
    const { password } = req.body;

    // Get user by reset token
    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return next(new AppError('Invalid or expired reset token', 400));
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generate new token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token
    });
  } catch (error) {
    logger.error('Reset password error', {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack
      },
      resetToken: req.params.resetToken,
      ip: req.ip
    });
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError('Refresh token is required', 400));
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      // Get user
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      if (user.status !== 'active') {
        return next(new AppError('User account is inactive', 401));
      }

      // Generate new tokens
      const newAccessToken = generateToken(user);
      const newRefreshToken = generateRefreshToken(user._id);

      res.status(200).json({
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return next(new AppError('Invalid refresh token', 401));
      }
      if (error.name === 'TokenExpiredError') {
        return next(new AppError('Refresh token expired', 401));
      }
      throw error;
    }
  } catch (error) {
    logger.error('Token refresh failed', {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack
      },
      ip: req.ip
    });
    next(error);
  }
};

// @desc    Update user details
// @route   PUT /api/auth/update-details
// @access  Private
exports.updateDetails = async (req, res, next) => {
  try {
    const { fullName, email, preferredLanguage } = req.body;

    const user = await User.findById(req.user.id);

    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (preferredLanguage) user.preferredLanguage = preferredLanguage;

    await user.save();

    logger.info('User details updated', {
      userId: user._id,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Update details error', {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack
      },
      userId: req.user.id,
      ip: req.ip
    });
    next(error);
  }
};
