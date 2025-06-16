// Load environment variables
require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const basicRoutes = require("./routes/index");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const orderRoutes = require("./routes/orderRoutes");
const customerRoutes = require("./routes/customerRoutes");
const productRoutes = require("./routes/productRoutes");
const branchRoutes = require("./routes/branchRoutes");
const trackingRoutes = require("./routes/trackingRoutes");
const reportRoutes = require("./routes/reportRoutes");
const logRoutes = require('./routes/logRoutes');
const connectDB = require("./config/database");
const cors = require("cors");
const morgan = require('morgan');
const { logger, requestLogger, errorLogger, dbLogger, authLogger } = require('./utils/logger');
const helmet = require('helmet');
const compression = require('compression');
const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/error');
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');
const deviceTypeRoutes = require('./routes/deviceTypeRoutes');
const brandRoutes = require('./routes/brandRoutes');
const modelRoutes = require('./routes/modelRoutes');
const partRoutes = require('./routes/partRoutes');
const branchPartRoutes = require('./routes/branchPartRoutes');

if (!process.env.DATABASE_URL) {
  logger.error('DATABASE_URL environment variable is missing');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 5000;

// Pretty-print JSON responses
app.enable('json spaces');
// We want to be consistent with URL paths, so we enable strict routing
app.enable('strict routing');

// Security middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: (origin, cb) => {
    // Herhangi bir Origin header yoksa (health check, server-server istekleri) izin ver
    if (!origin) return cb(null, true);

    // Geliştirme ortamında tüm origin'lere izin ver
    if (process.env.NODE_ENV === 'development') {
      return cb(null, true);
    }

    // ALLOWED_ORIGINS env değişkeni '*' ise tümüne izin ver
    if (process.env.ALLOWED_ORIGINS === '*') return cb(null, true);

    // Production: listede varsa izin ver
    if (process.env.ALLOWED_ORIGINS?.split(',').includes(origin)) {
      return cb(null, true);
    }
    cb(new Error('CORS not allowed'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: true,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.DATABASE_URL,
    ttl: 24 * 60 * 60, // 1 day
    autoRemove: 'native'
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Rate limiting - more lenient in development
const isDevelopment = process.env.NODE_ENV === 'development';

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // Higher limit in development
  message: 'Too many requests from this IP, please try again later'
});

// More lenient rate limit for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 50 : 5, // Much higher limit in development
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting - disabled in development
if (process.env.NODE_ENV === 'production') {
  app.use('/api/auth/login', loginLimiter); // Apply login limiter to login route
  app.use('/api/', globalLimiter); // Apply global limiter to all other routes
}
// Rate limiting is disabled in development for easier testing

// Add logging middleware
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined', { stream: logger.stream }));
app.use(requestLogger);

// Add database logging
mongoose.set('debug', (collectionName, method, query, doc) => {
  dbLogger.logQuery({
    collection: collectionName,
    operationType: method,
    query: query,
    duration: doc?.executionTimeMillis
  });
});

// Add error handling middleware
app.use(errorLogger);

// Database connection
connectDB().catch(err => {
  logger.error('Failed to connect to database', {
    error: {
      message: err.message,
      name: err.name,
      stack: err.stack
    }
  });
  process.exit(1);
});

/* i18next yapılandırması geçici olarak devre dışı bırakıldı (tr.json, de.json, en.json dosyaları bulunamadığı için)
// Initialize i18next
i18next
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    fallbackLng: process.env.DEFAULT_LANGUAGE || 'tr',
    preload: (process.env.SUPPORTED_LANGUAGES || 'tr,de,en').split(','),
    resources: {
      tr: { translation: require('./locales/tr.json') },
      de: { translation: require('./locales/de.json') },
      en: { translation: require('./locales/en.json') }
    }
  });

app.use(i18nextMiddleware.handle(i18next));
*/

// API Routes
app.use('/', basicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/public', trackingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/device-types', deviceTypeRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/parts', partRoutes);
app.use('/api/branch-parts', branchPartRoutes);

// 404 handler
app.use((req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// Global error handlers
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled promise rejection', {
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack
    }
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', {
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack
    }
  });
  process.exit(1);
});

// Start server unless running under test
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    logger.info(`Server is running on port ${port}`, {
      environment: process.env.NODE_ENV,
      port
    });
  });
}

module.exports = app;
