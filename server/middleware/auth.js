const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { logger } = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Protect routes
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from Authorization header only
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      logger.warn('Auth attempt without token', {
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        logger.warn('Auth attempt with invalid user', {
          userId: decoded.id,
          ip: req.ip,
          path: req.path,
          method: req.method
        });
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.status !== 'active') {
        logger.warn('Auth attempt with inactive user', {
          userId: user._id,
          ip: req.ip,
          path: req.path,
          method: req.method
        });
        return res.status(401).json({
          success: false,
          message: 'User account is inactive'
        });
      }

      // Set user in request with branchId compatibility
      req.user = user;
      req.user.branchId = user.branch; // Add branchId for compatibility
      next();
    } catch (err) {
      logger.error('Token verification failed', {
        error: {
          message: err.message,
          name: err.name,
          stack: err.stack
        },
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (err) {
    logger.error('Auth middleware error', {
      error: {
        message: err.message,
        name: err.name,
        stack: err.stack
      },
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      logger.warn('Unauthorized role access attempt', {
        userId: req.user._id,
        userRole: req.user.role,
        requiredRoles: roles,
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if user has permission for specific module action
const checkPermission = (module, action) => {
  return (req, res, next) => {
    if (!req.user.hasPermission(module, action)) {
      return res.status(403).json({
        success: false,
        message: `User does not have permission to ${action} in ${module} module`
      });
    }
    next();
  };
};

// Check branch access
const checkBranchAccess = (req, res, next) => {
  // Admin and central staff have access to all branches
  if (req.user.role === 'admin' || req.user.role === 'central_staff') {
    return next();
  }

  // Get branchId from either params or query
  const branchId = req.params.branchId || req.query.branchId;

  // Branch staff can only access their own branch
  if (branchId && branchId !== req.user.branch.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this branch'
    });
  }

  next();
};

// Set language based on user preference
const setLanguage = (req, res, next) => {
  if (req.user && req.user.preferredLanguage) {
    req.language = req.user.preferredLanguage;
  } else if (req.headers['accept-language']) {
    req.language = req.headers['accept-language'].split(',')[0];
  } else {
    req.language = 'tr';
  }
  next();
};

module.exports = { 
  protect, 
  authorize, 
  checkPermission, 
  checkBranchAccess, 
  setLanguage,
  authenticateToken: protect // Alias for backward compatibility
}; 