const express = require('express');
const router = express.Router();

// Import route files
const authRoutes = require('./auth');
const customerRoutes = require('./customerRoutes');
const orderRoutes = require('./orderRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const branchRoutes = require('./branchRoutes');
const authMiddleware = require('./authRoutes');
const roleRoutes = require('./roles');
const userRoutes = require('./users');
const logRoutes = require('./logRoutes');
const trackingRoutes = require('./trackingRoutes');
const reportRoutes = require('./reportRoutes');
const productRoutes = require('./productRoutes');
const modelRoutes = require('./modelRoutes');

// Use routes
router.use('/auth', authMiddleware);
router.use('/customers', customerRoutes);
router.use('/orders', orderRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/branches', branchRoutes);
router.use('/roles', roleRoutes);
router.use('/users', userRoutes);
router.use('/logs', logRoutes);
router.use('/tracking', trackingRoutes);
router.use('/reports', reportRoutes);
router.use('/products', productRoutes);
router.use('/models', modelRoutes);

// Root path response
router.get("/", (req, res) => {
  res.status(200).send("Welcome to Your Website!");
});

router.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

module.exports = router;
