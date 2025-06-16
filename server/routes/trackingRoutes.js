const express = require('express');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const router = express.Router();

// Public order tracking by barcode
router.get('/track/barcode/:barcode', async (req, res) => {
  try {
    const barcode = req.params.barcode;

    const order = await Order.findOne({ barcode })
      .populate('customerId', 'name phone')
      .populate('branchId', 'name address phone')
      .populate('assignedTechnician', 'name')
      .select('orderNumber status payment createdAt estimatedCompletion actualCompletion device serviceType warranty statusHistory');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found with this barcode'
      });
    }

    // Return order tracking information
    res.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        device: order.device,
        serviceType: order.serviceType,
        createdAt: order.createdAt,
        estimatedCompletion: order.estimatedCompletion,
        actualCompletion: order.actualCompletion,
        payment: {
          amount: order.payment.amount,
          status: order.payment.status,
          paidAmount: order.payment.paidAmount,
          dueAmount: order.payment.dueAmount
        },
        warranty: order.warranty,
        statusHistory: order.statusHistory,
        branch: {
          name: order.branchId?.name,
          address: order.branchId?.address,
          phone: order.branchId?.phone
        },
        customer: {
          name: order.customerId?.name,
          phone: order.customerId?.phone
        },
        assignedTechnician: order.assignedTechnician?.name
      }
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error tracking order'
    });
  }
});

// Public order tracking by order number
router.get('/track/order/:orderNumber', async (req, res) => {
  try {
    const orderNumber = req.params.orderNumber;

    const order = await Order.findOne({ orderNumber })
      .populate('customerId', 'name phone')
      .populate('branchId', 'name address phone')
      .populate('assignedTechnician', 'name')
      .select('orderNumber status payment createdAt estimatedCompletion actualCompletion device serviceType warranty statusHistory');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found with this order number'
      });
    }

    // Return order tracking information
    res.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        device: order.device,
        serviceType: order.serviceType,
        createdAt: order.createdAt,
        estimatedCompletion: order.estimatedCompletion,
        actualCompletion: order.actualCompletion,
        payment: {
          amount: order.payment.amount,
          status: order.payment.status,
          paidAmount: order.payment.paidAmount,
          dueAmount: order.payment.dueAmount
        },
        warranty: order.warranty,
        statusHistory: order.statusHistory,
        branch: {
          name: order.branchId?.name,
          address: order.branchId?.address,
          phone: order.branchId?.phone
        },
        customer: {
          name: order.customerId?.name,
          phone: order.customerId?.phone
        },
        assignedTechnician: order.assignedTechnician?.name
      }
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error tracking order'
    });
  }
});

module.exports = router;
