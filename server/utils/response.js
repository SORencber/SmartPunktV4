const { authLogger } = require('./logger');

// Success response
const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message,
    ...(data && { data })
  };

  authLogger.info('API Response', {
    statusCode,
    message,
    path: res.req.path,
    method: res.req.method
  });

  return res.status(statusCode).json(response);
};

// Error response
const errorResponse = (res, message = 'Error', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
    ...(errors && { errors })
  };

  authLogger.error('API Error Response', {
    statusCode,
    message,
    errors,
    path: res.req.path,
    method: res.req.method
  });

  return res.status(statusCode).json(response);
};

// Pagination response
const paginatedResponse = (res, data, pagination, message = 'Success') => {
  const response = {
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.totalPages,
      totalItems: pagination.totalItems,
      hasNext: pagination.hasNext,
      hasPrevious: pagination.hasPrevious
    }
  };

  authLogger.info('Paginated API Response', {
    statusCode: 200,
    message,
    path: res.req.path,
    method: res.req.method,
    pagination: response.pagination
  });

  return res.status(200).json(response);
};

// Created response
const createdResponse = (res, data = null, message = 'Resource created successfully') => {
  return successResponse(res, data, message, 201);
};

// No content response
const noContentResponse = (res) => {
  authLogger.info('No Content Response', {
    statusCode: 204,
    path: res.req.path,
    method: res.req.method
  });

  return res.status(204).end();
};

// Bad request response
const badRequestResponse = (res, message = 'Bad request', errors = null) => {
  return errorResponse(res, message, 400, errors);
};

// Unauthorized response
const unauthorizedResponse = (res, message = 'Unauthorized') => {
  return errorResponse(res, message, 401);
};

// Forbidden response
const forbiddenResponse = (res, message = 'Forbidden') => {
  return errorResponse(res, message, 403);
};

// Not found response
const notFoundResponse = (res, message = 'Resource not found') => {
  return errorResponse(res, message, 404);
};

// Conflict response
const conflictResponse = (res, message = 'Resource conflict', errors = null) => {
  return errorResponse(res, message, 409, errors);
};

// Validation error response
const validationErrorResponse = (res, errors) => {
  return errorResponse(res, 'Validation failed', 422, errors);
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
  createdResponse,
  noContentResponse,
  badRequestResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  validationErrorResponse
}; 