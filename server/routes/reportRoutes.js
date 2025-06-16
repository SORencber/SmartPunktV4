const express = require('express');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Branch = require('../models/Branch');
const { auth } = require('./middleware/auth');
const router = express.Router();

// Generate receipt for an order
router.post('/orders/:id/receipt', auth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const branchId = req.user.branchId;
    
    let matchConditions = { _id: orderId };
    
    // Branch staff can only generate receipts for orders from their branch
    if (req.user.role === 'branch_staff' || req.user.role === 'technician') {
      matchConditions.branchId = branchId;
    }

    const order = await Order.findOne(matchConditions)
      .populate('customerId')
      .populate('branchId')
      .populate('products.productId')
      .populate('assignedTechnician', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Calculate totals
    const productsTotal = order.products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
    const laborTotal = order.labor?.total || 0;
    const totalAmount = productsTotal + laborTotal;

    const receipt = {
      receiptNumber: `RCP-${order.orderNumber}`,
      order: {
        orderNumber: order.orderNumber,
        barcode: order.barcode,
        createdAt: order.createdAt,
        status: order.status
      },
      customer: {
        name: order.customerId.name,
        phone: order.customerId.phone,
        email: order.customerId.email,
        address: order.customerId.address
      },
      branch: {
        name: order.branchId.name,
        address: order.branchId.address,
        phone: order.branchId.phone,
        email: order.branchId.email
      },
      device: order.device,
      serviceType: order.serviceType,
      description: order.description,
      products: order.products.map(product => ({
        name: product.name,
        quantity: product.quantity,
        price: product.price,
        total: product.price * product.quantity
      })),
      labor: order.labor,
      totals: {
        productsTotal,
        laborTotal,
        totalAmount,
        paidAmount: order.payment.paidAmount,
        dueAmount: order.payment.dueAmount
      },
      payment: {
        method: order.payment.method,
        status: order.payment.status,
        amount: order.payment.amount
      },
      warranty: order.warranty,
      staff: req.user.name,
      generatedAt: new Date()
    };

    res.json({
      success: true,
      receipt
    });
  } catch (error) {
    console.error('Generate receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating receipt'
    });
  }
});

// Generate warranty certificate
router.post('/orders/:id/warranty', auth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const branchId = req.user.branchId;
    
    let matchConditions = { _id: orderId };
    
    // Branch staff can only generate warranty for orders from their branch
    if (req.user.role === 'branch_staff' || req.user.role === 'technician') {
      matchConditions.branchId = branchId;
    }

    const order = await Order.findOne(matchConditions)
      .populate('customerId')
      .populate('branchId')
      .populate('products.productId');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'delivered' && order.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Warranty certificate can only be generated for delivered/completed orders'
      });
    }

    if (!order.warranty.isEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Warranty is not enabled for this order'
      });
    }

    // Generate unique warranty certificate number
    const certificateNumber = `WRT-${order.orderNumber}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const warrantyStartDate = order.warranty.startDate || new Date();
    const warrantyEndDate = new Date(warrantyStartDate.getTime() + (order.warranty.period * 24 * 60 * 60 * 1000));

    const warrantyCertificate = {
      certificateNumber,
      order: {
        orderNumber: order.orderNumber,
        createdAt: order.createdAt
      },
      customer: {
        name: order.customerId.name,
        phone: order.customerId.phone,
        address: order.customerId.address
      },
      branch: {
        name: order.branchId.name,
        address: order.branchId.address,
        phone: order.branchId.phone
      },
      device: order.device,
      warrantyPeriod: order.warranty.period,
      warrantyStartDate,
      warrantyEndDate,
      coverageDetails: {
        coveredParts: order.products.map(product => ({
          name: product.name,
          quantity: product.quantity
        })),
        exclusions: [
          'Water damage or liquid contact',
          'Physical damage from drops or accidents',
          'User error or misuse',
          'Unauthorized repairs or modifications',
          'Normal wear and tear'
        ]
      },
      terms: {
        period: `${order.warranty.period} days from delivery date`,
        coverage: 'Manufacturing defects and part failures under normal usage',
        claimProcess: 'Present this certificate at the issuing branch for warranty claims'
      },
      issuedBy: req.user.name,
      issuedAt: new Date()
    };

    // Update order warranty information
    if (!order.warranty.startDate) {
      order.warranty.startDate = warrantyStartDate;
      order.warranty.endDate = warrantyEndDate;
      await order.save();
    }

    res.json({
      success: true,
      warrantyCertificate
    });
  } catch (error) {
    console.error('Generate warranty certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating warranty certificate'
    });
  }
});

// Generate barcode invoice (for headquarters role)
router.post('/orders/:id/barcode-invoice', auth, async (req, res) => {
  try {
    const orderId = req.params.id;

    // Only headquarters staff can generate barcode invoices for all orders
    if (req.user.role !== 'headquarters' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only headquarters staff can generate barcode invoices'
      });
    }

    const order = await Order.findById(orderId)
      .populate('customerId')
      .populate('branchId')
      .populate('products.productId');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const barcodeInvoice = {
      invoiceNumber: `INV-${order.orderNumber}`,
      barcode: order.barcode,
      order: {
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        status: order.status
      },
      customer: {
        name: order.customerId.name,
        phone: order.customerId.phone
      },
      branch: {
        name: order.branchId.name,
        address: order.branchId.address,
        phone: order.branchId.phone
      },
      device: `${order.device.brand} ${order.device.model}`,
      serviceType: order.serviceType,
      totalAmount: order.payment.amount,
      generatedBy: req.user.name,
      generatedAt: new Date()
    };

    res.json({
      success: true,
      message: 'Barcode invoice generated successfully',
      barcodeInvoice
    });
  } catch (error) {
    console.error('Generate barcode invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating barcode invoice'
    });
  }
});

module.exports = router;
