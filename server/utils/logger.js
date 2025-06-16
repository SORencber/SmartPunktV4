const winston = require('winston');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Ensure logs directory exists
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          // Hem string hem de obje mesajları okunabilir şekilde bas
          const base = `${timestamp} ${level}:`;
          if (typeof message === 'object') {
            return `${base} ${JSON.stringify({ message, ...meta })}`;
          }
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${base} ${message}${metaStr}`;
        })
      )
    }),
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs with level 'debug' and below to debug.log in development
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.File({
        filename: path.join(logDir, 'debug.log'),
        level: 'debug',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    ] : [])
  ]
});

// Create a stream object for Morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Add request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const memory = process.memoryUsage();
    const load = os.loadavg()[0]; // 1-minute average
    logger.info({
      type: 'request',
      method: req.method,
      url: req.url,
      status: res.statusCode,
      durationMs,
      memoryRss: memory.rss,
      memoryHeapUsed: memory.heapUsed,
      cpuLoad1m: load,
      userAgent: req.get('user-agent'),
      ip: req.ip
    });
  });
  next();
};

// Add error logging middleware
const errorLogger = (err, req, res, next) => {
  logger.error({
    type: 'error',
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name
    },
    request: {
      method: req.method,
      url: req.url,
      body: req.body,
      params: req.params,
      query: req.query,
      headers: req.headers
    }
  });
  next(err);
};

// Add database logging
const dbLogger = {
  logQuery: (query) => {
    logger.debug({
      type: 'database',
      operation: 'query',
      collection: query.collection,
      operationType: query.operationType,
      query: query.query,
      duration: query.duration
    });
  },
  logError: (error) => {
    logger.error({
      type: 'database',
      operation: 'error',
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    });
  }
};

// Add authentication logging
const authLogger = {
  logLogin: (user, success, error = null) => {
    logger.info({
      type: 'auth',
      operation: 'login',
      userId: user?._id,
      email: user?.email,
      success,
      error: error ? {
        message: error.message,
        name: error.name
      } : null
    });
  },
  logLogout: (user) => {
    logger.info({
      type: 'auth',
      operation: 'logout',
      userId: user?._id,
      email: user?.email
    });
  },
  logTokenRefresh: (user, success, error = null) => {
    logger.info({
      type: 'auth',
      operation: 'token_refresh',
      userId: user?._id,
      email: user?.email,
      success,
      error: error ? {
        message: error.message,
        name: error.name
      } : null
    });
  }
};

module.exports = {
  logger,
  requestLogger,
  errorLogger,
  dbLogger,
  authLogger
}; 