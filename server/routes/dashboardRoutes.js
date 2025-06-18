const express = require('express');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Repair = require('../models/Repair');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Get dashboard statistics
router.get('/stats', protect, async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const matchConditions = {};

    // Branch staff can only see their branch stats
    if (req.user.role === 'branch_staff' || req.user.role === 'technician') {
      matchConditions.branch = branchId;
    }

    // Get total orders and revenue
    const orderStats = await Order.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$payment.amount' }
        }
      }
    ]);

    // Get active customers count
    const activeCustomers = await Customer.countDocuments({
      ...matchConditions,
      isActive: true
    });

    // Get pending orders count
    const pendingOrders = await Order.countDocuments({
      ...matchConditions,
      status: 'pending'
    });

    // Get orders completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedToday = await Order.countDocuments({
      ...matchConditions,
      status: 'completed',
      completedAt: { $gte: today }
    });

    // Get orders delivered today
    const deliveredToday = await Order.countDocuments({
      ...matchConditions,
      status: 'delivered',
      updatedAt: { $gte: today }
    });

    // --- Repairs stats ---
    const totalRepairs = await Repair.countDocuments({ ...matchConditions });
    const pendingRepairs = await Repair.countDocuments({ ...matchConditions, status: 'pending' });

    const stats = {
      totalOrders: orderStats[0]?.totalOrders || 0,
      totalRevenue: orderStats[0]?.totalRevenue || 0,
      activeCustomers,
      pendingOrders,
      completedToday,
      totalRepairs,
      pendingRepairs,
      deliveredToday
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard stats'
    });
  }
});

// Get recent orders for dashboard
router.get('/recent-orders', protect, async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const matchConditions = {};

    // Branch staff can only see their branch orders
    if (req.user.role === 'branch_staff' || req.user.role === 'technician') {
      matchConditions.branch = branchId;
    }

    const orders = await Order.find(matchConditions)
      .populate('customerId', 'name')
      .populate('branch', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber status payment.amount createdAt device customerId branch');

    const formattedOrders = orders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      customerName: order.customerId.name,
      deviceType: `${order.device.brand} ${order.device.model}`,
      status: order.status,
      total: order.payment.amount,
      createdAt: order.createdAt,
      branchName: order.branch?.name || ''
    }));

    res.json({
      success: true,
      orders: formattedOrders
    });
  } catch (error) {
    console.error('Recent orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching recent orders'
    });
  }
});

module.exports = router;
