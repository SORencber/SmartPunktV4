const { authLogger } = require('./logger');

// Email validation
const isValidEmail = (email) => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return emailRegex.test(email);
};

// Password validation
const isValidPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return passwordRegex.test(password);
};

// Phone number validation
const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  return phoneRegex.test(phone);
};

// Role validation
const isValidRole = (role) => {
  const validRoles = ['admin', 'headquarters', 'branch_staff', 'technician'];
  return validRoles.includes(role);
};

// ObjectId validation
const isValidObjectId = (id) => {
  const mongoose = require('mongoose');
  return mongoose.Types.ObjectId.isValid(id);
};

// Validate request body
const validateRequestBody = (schema) => {
  return (req, res, next) => {
    try {
      const { error } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }

      next();
    } catch (error) {
      authLogger.error('Request validation error', error);
      res.status(500).json({
        success: false,
        message: 'Server error during validation'
      });
    }
  };
};

// Validate query parameters
const validateQueryParams = (schema) => {
  return (req, res, next) => {
    try {
      const { error } = schema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));

        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors
        });
      }

      next();
    } catch (error) {
      authLogger.error('Query validation error', error);
      res.status(500).json({
        success: false,
        message: 'Server error during validation'
      });
    }
  };
};

// Validate URL parameters
const validateUrlParams = (schema) => {
  return (req, res, next) => {
    try {
      const { error } = schema.validate(req.params, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));

        return res.status(400).json({
          success: false,
          message: 'Invalid URL parameters',
          errors
        });
      }

      next();
    } catch (error) {
      authLogger.error('URL parameter validation error', error);
      res.status(500).json({
        success: false,
        message: 'Server error during validation'
      });
    }
  };
};

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidPhoneNumber,
  isValidRole,
  isValidObjectId,
  validateRequestBody,
  validateQueryParams,
  validateUrlParams
}; 