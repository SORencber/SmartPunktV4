const express = require('express');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const { auth } = require('./middleware/auth');
const mongoose = require('mongoose');
const router = express.Router();
const Repair = require('../models/Repair');

// Get all orders (with branch filtering for branch staff)
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, customerId } = req.query;
    const branchId = req.user.branchId;
    
    // Build query conditions
    let matchConditions = {};
    
    // Role-based filtering
    if (req.user.role === 'branch_staff' || req.user.role === 'technician') {
      matchConditions.branch = branchId;
    }
    
    // Status filtering
    if (status && status !== 'all') {
      matchConditions.status = status;
    }
    
    // Search functionality
    if (search) {
      const customers = await Customer.find({
        $or: [
          { name: new RegExp(search, 'i') },
          { phone: new RegExp(search, 'i') }
        ]
      }).select('_id');
      
      const customerIds = customers.map(c => c._id);
      
      matchConditions.$or = [
        { orderNumber: new RegExp(search, 'i') },
        { orderId: new RegExp(search, 'i') },
        { customerId: { $in: customerIds } },
        { 'device.brand': new RegExp(search, 'i') },
        { 'device.model': new RegExp(search, 'i') },
        { 'branch.name': new RegExp(search, 'i') },
        { 'items.name': new RegExp(search, 'i') }
      ];
    }

    // CustomerId filtering
    if (customerId) {
      matchConditions.customerId = customerId;
    }

    // Branch filter for admins
    if (req.user.role === 'admin' && req.query.branch && req.query.branch !== 'all') {
      const branchIdParam = req.query.branch.toString();
      if (!mongoose.Types.ObjectId.isValid(branchIdParam)) {
        return res.status(400).json({ success:false, message:'Invalid branch id'});
      }
      matchConditions.branch = new mongoose.Types.ObjectId(branchIdParam);
    }

    const orders = await Order.find(matchConditions)
      .populate('customerId', 'name phone email')
      .populate('branch', 'name')
      // .populate('assignedTechnician', 'name') // removed to avoid StrictPopulateError
      // .populate('products.productId', 'type brand model part price')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(matchConditions);

    res.json({
      success: true,
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching orders'
    });
  }
});

// Get order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const branchId = req.user.branchId;
    
    let matchConditions = { _id: orderId };
    
    // Branch staff can only see orders from their branch
    if (req.user.role === 'branch_staff' || req.user.role === 'technician') {
      matchConditions.branch = branchId;
    }

    const order = await Order.findOne(matchConditions)
      .populate('customerId')
      .populate('branch', 'name')
      .populate('statusHistory.user', 'fullName email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching order'
    });
  }
});

// Create new order
router.post('/', auth, async (req, res) => {
  try {
    const {
      customerId,
      device,
      loanedDevice,
      serviceType,
      description,
      products: productsRaw,
      items: itemsRaw,
      labor,
      estimatedCompletion,
      priority = 'standard',
      payment = {}
    } = req.body;

    // Hem items hem products desteği
    let products = itemsRaw || productsRaw;
    if (typeof products === 'string') {
      try { products = JSON.parse(products); } catch (err) { products = []; }
    }
    if (!Array.isArray(products)) products = [];

    // Determine id field (productId or partId) and validate
    const validItems = products
      .map(p => {
        const id = p.productId || p.partId;
        return id && mongoose.Types.ObjectId.isValid(id) ? { ...p, _idRef: id } : null;
      })
      .filter(Boolean);

    if (validItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid parts selected' });
    }

    // Validate required fields
    if (!customerId || !device || !serviceType || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Fetch customer & verify branch ownership
    if (req.user.role === 'branch_staff' || req.user.role === 'technician') {
      const customer = await Customer.findOne({ _id: customerId, branchId: req.user.branchId });
      if (!customer) {
        return res.status(403).json({
          success: false,
          message: 'Customer not found in your branch'
        });
      }
    }

    const customerDoc = await Customer.findById(customerId);
    if (!customerDoc) {
      return res.status(404).json({ success:false, message:'Customer not found'});
    }

    // Attempt to fetch referenced products; continue even if some are missing
    const productIds = validItems.map(p => p._idRef);
    const availableProducts = await Product.find({
      _id: { $in: productIds },
      status: 'active'
    }).select('name type brand model part deviceTypeId brandId modelId price');

    // Build a quick lookup map for found products
    const productMap = new Map(availableProducts.map(p => [p._id.toString(), p]));

    // Calculate total items price with proper number conversion
    const totalItemsPrice = validItems.reduce((sum, p) => {
      const price = Number(p.price) || 0;
      const quantity = Number(p.quantity) || 1;
      return sum + (price * quantity);
    }, 0);

    // Extract deposit & centralPayment from request (ensure they are numbers)
    const depositAmount = Number(payment.depositAmount ?? req.body.depositAmount ?? 0);
    const centralPayment = Number(req.body.centralPayment || 0);
    const paymentAmount = Number(payment?.amount) || totalItemsPrice;

    // Resolve device type string (enum) if an ObjectId was sent
    const allowedTypes = ['Computer','Tablet','iPad','Phone','Other'];
    let deviceTypeValue = device.type;
    if (!allowedTypes.includes(deviceTypeValue)) deviceTypeValue = 'Other';

    // Generate unique order id (YYMMDD-rand4)
    const d = new Date();
    const ordId = `${d.getFullYear().toString().slice(-2)}${(d.getMonth()+1).toString().padStart(2,'0')}${d.getDate().toString().padStart(2,'0')}-${Math.floor(Math.random()*10000).toString().padStart(4,'0')}`;

    // Merkez/Şube servis ayrımı ve hesaplamalar
    const isCentralService = req.body.isCentralService === true || req.body.isCentralService === 'true';
    let centralService = undefined;
    let branchService = undefined;
    let totalCentralPayment = 0;
    let totalBranchProfit = 0;

    if (isCentralService) {
      centralService = {
        partPrices: Number(req.body.centralPartPrices) || 0,
        serviceFee: Number(req.body.centralServiceFee) || 0,
        branchServiceFee: Number(req.body.branchServiceFee) || 0
      };
      totalCentralPayment = centralService.partPrices + centralService.serviceFee;
      totalBranchProfit = centralService.branchServiceFee;
    } else {
      branchService = {
        centralPartPayment: Number(req.body.centralPartPayment) || 0,
        branchPartProfit: Number(req.body.branchPartProfit) || 0,
        branchServiceFee: Number(req.body.branchServiceFee) || 0
      };
      totalCentralPayment = branchService.centralPartPayment;
      totalBranchProfit = branchService.branchPartProfit + branchService.branchServiceFee;
    }

    // --- BRANCH SNAPSHOT EKLEME ---
    let branchSnapshot = null;
    if (req.user.branch) {
      // Eğer req.user.branch bir obje ise, doğrudan kullan
      if (typeof req.user.branch === 'object' && req.user.branch.name) {
        branchSnapshot = req.user.branch;
      } else {
        // ID ise, veritabanından çek
        const Branch = require('../models/Branch');
        const branchDoc = await Branch.findById(req.user.branch);
        if (branchDoc) branchSnapshot = branchDoc.toObject();
      }
    } else if (req.user.branchId) {
      const Branch = require('../models/Branch');
      const branchDoc = await Branch.findById(req.user.branchId);
      if (branchDoc) branchSnapshot = branchDoc.toObject();
    }

    const orderData = {
      orderId: ordId,
      branch: req.user.branch || req.user.branchId,
      branchSnapshot,
      customerId,
      customer: {
        name: customerDoc.name,
        phone: customerDoc.phone,
        email: customerDoc.email,
        preferredLanguage: customerDoc.preferredLanguage || 'TR'
      },
      device: {
        deviceTypeId: device.type,
        brandId: device.brand,
        modelId: device.model,
        serialNumber: device.serialNumber || '',
        condition: device.condition || ''
      },
      loanedDevice: loanedDevice || null,
      isLoanedDeviceGiven: !!loanedDevice,
      parts: productIds,
      items: validItems.map(p => {
        const product = productMap.get(p._idRef.toString());
        const unitPrice = Number(p.price) || Number(product?.price) || 0;
        const quantity = Number(p.quantity) || 1;
        return {
          partId: p._idRef,
          name: (() => {
            if (product) {
              // Attempt multilingual name first
              const n = product.name;
              if (n) {
                if (typeof n === 'string') return n;
                if (n.tr || n.en || n.de) return n.tr || n.en || n.de;
              }
              // Use product.part field as sensible default
              if (product.part) return product.part;
              // Last fallback combine fields
              const segments = [product.type, product.brand, product.model, product.part].filter(Boolean);
              if (segments.length) return segments.join(' ');
            }
            // Frontend'den gelen name varsa onu kullan
            if (p.name) return p.name;
            return 'Custom Part';
          })(),
          deviceTypeId: device.deviceTypeId,
          brandId: device.brandId,
          modelId: device.modelId,
          quantity: quantity,
          unitPrice: unitPrice,
          totalPrice: unitPrice * quantity,
          warrantyEligible: true,
          warrantyMonths: 6
        };
      }),
      status: 'pending',
      payment: {
        totalAmount: paymentAmount,
        depositAmount: depositAmount,
        paidAmount: depositAmount,
        remainingAmount: Math.max(0, paymentAmount - depositAmount),
        centralPayment: centralPayment,
        paymentMethod: req.body.paymentMethod || payment?.method || 'cash'
      },
      createdBy: req.user._id,
      notes: {
        tr: description
      },
      isCentralService,
      centralService: isCentralService ? centralService : undefined,
      branchService: !isCentralService ? branchService : undefined,
      totalCentralPayment,
      totalBranchProfit
    };

    const order = new Order(orderData);
    await order.save();

    // Update customer order count with proper number conversion
    await Customer.findByIdAndUpdate(
      customerId,
      { 
        $inc: { 
          totalOrders: 1,
          totalSpent: paymentAmount
        }
      }
    );

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        _id: order._id,
        orderNumber: order.orderId,  // Use orderId as orderNumber for consistency
        barcode: order.orderId        // Use orderId as barcode temporarily
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating order',
      error: error.message
    });
  }
});

// Update order status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const orderId = req.params.id;
    const branchId = req.user.branchId;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    let matchConditions = { _id: orderId };
    
    // Branch staff can only update orders from their branch
    if (req.user.role === 'branch_staff' || req.user.role === 'technician') {
      matchConditions.branch = branchId;
    }

    const order = await Order.findOne(matchConditions);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update status
    order.status = status;
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status,
      user: req.user._id,
      timestamp: new Date(),
      notes: notes || `Status updated to ${status}`
    });

    if (status === 'completed') {
      order.actualCompletion = new Date();
    }

    await order.save();

    // If status is delivered, insert a copy into Repair collection
    if (status === 'delivered') {
      const orderObj = order.toObject();
      delete orderObj._id;
      orderObj.originalOrderId = order._id;

      // Branch snapshot ekle
      if (order.branchSnapshot) {
        orderObj.branchSnapshot = order.branchSnapshot;
      } else if (order.branch && order.branch.name) {
        orderObj.branchSnapshot = {
          _id: order.branch._id,
          name: order.branch.name
        };
      }

      // branch ve customerId ObjectId olarak kalsın
      if (orderObj.branch && orderObj.branch._id) {
        orderObj.branch = orderObj.branch._id;
      }
      if (orderObj.customerId && orderObj.customerId._id) {
        orderObj.customerId = orderObj.customerId._id;
      }

      try {
        await Repair.create(orderObj);
      } catch (err) {
        console.error('Failed to insert into Repair collection:', err);
      }
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: {
        _id: order._id,
        status: order.status,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating order status'
    });
  }
});

// Cancel order
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const orderId = req.params.id;
    const branchId = req.user.branchId;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason is required'
      });
    }

    let matchConditions = { _id: orderId };
    
    // Branch staff can only cancel orders from their branch
    if (req.user.role === 'branch_staff' || req.user.role === 'technician') {
      matchConditions.branch = branchId;
    }

    const order = await Order.findOne(matchConditions);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled'
      });
    }

    if (order.status === 'delivered' || order.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed or delivered orders'
      });
    }

    // Restore stock for cancelled order
    for (const orderProduct of order.products) {
      await Product.findByIdAndUpdate(
        orderProduct.productId._id,
        { $inc: { stock: orderProduct.quantity } }
      );
    }

    // Update order
    order.status = 'cancelled';
    order.cancellation = {
      isCancelled: true,
      cancelledAt: new Date(),
      cancelledBy: req.user._id,
      reason
    };
    order.statusHistory.push({
      status: 'cancelled',
      user: req.user._id,
      timestamp: new Date(),
      notes: `Order cancelled: ${reason}`
    });

    await order.save();

    // Update customer stats
    await Customer.findByIdAndUpdate(
      order.customerId,
      { 
        $inc: { 
          totalOrders: -1,
          totalSpent: -order.payment.amount 
        }
      }
    );

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order: {
        _id: order._id,
        status: order.status,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling order'
    });
  }
});

// Generate barcode (for headquarters role)
router.post('/:id/barcode', auth, async (req, res) => {
  try {
    const orderId = req.params.id;

    // Only headquarters staff can generate barcodes for all orders
    if (req.user.role !== 'headquarters' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only headquarters staff can generate barcodes'
      });
    }

    const order = await Order.findById(orderId)
      .populate('customerId')
      .populate('branch', 'name')
      // .populate('products.productId') removed due to schema mismatch
      // .populate('statusHistory.user', 'name') removed to avoid StrictPopulateError;

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Barcode generated successfully',
      barcode: order.barcode,
      order: {
        orderNumber: order.orderNumber,
        customerName: order.customerId.name,
        branchName: order.branch.name,
        total: order.payment.amount,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    console.error('Generate barcode error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating barcode'
    });
  }
});

// Update order
router.put('/:id', auth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const update = req.body;

    console.log('Order update request:', { orderId, update });

    // Hem items hem products desteği
    let items = update.items || update.products;
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch (err) { items = []; }
    }
    if (!Array.isArray(items)) items = [];

    // Only allow branch staff/technician to update their own branch's orders
    let matchConditions = { _id: orderId };
    if (req.user.role === 'branch_staff' || req.user.role === 'technician') {
      matchConditions.branch = req.user.branchId;
    }

    const order = await Order.findOne(matchConditions);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Update fields safely with validation
    if (update.customerId) order.customerId = update.customerId;
    
    // Handle device object updates
    if (update.device) {
      order.device = {
        ...order.device,
        ...update.device,
        // Frontend'den gelen type, brand, model alanlarını doğru field'lara map et
        deviceTypeId: update.device.deviceTypeId || update.device.type || order.device.deviceTypeId,
        brandId: update.device.brandId || update.device.brand || order.device.brandId,
        modelId: update.device.modelId || update.device.model || order.device.modelId,
        serialNumber: update.device.serialNumber || order.device.serialNumber || '',
        condition: update.device.condition || order.device.condition || '',
        names: update.device.names || order.device.names || {}
      };
    }
    
    // Handle loanedDevice updates
    if (update.loanedDevice !== undefined) {
      order.loanedDevice = update.loanedDevice;
    }
    
    if (update.isLoanedDeviceGiven !== undefined) {
      order.isLoanedDeviceGiven = update.isLoanedDeviceGiven;
    }
    
    // Handle items/parts updates
    if (items && items.length > 0) {
      order.items = items.map(item => ({
        partId: item.partId || item.productId || item._id,
        name: item.name || 'Unknown Part',
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
        unitPrice: Number(item.price) || 0,
        totalPrice: (Number(item.price) || 0) * (Number(item.quantity) || 1)
      }));
    }
    
    // Handle payment updates
    if (update.payment) {
      order.payment = {
        ...order.payment,
        ...update.payment,
        totalAmount: Number(update.payment.totalAmount || update.payment.amount) || order.payment.totalAmount,
        depositAmount: Number(update.payment.depositAmount) || order.payment.depositAmount,
        paidAmount: Number(update.payment.paidAmount) || order.payment.paidAmount,
        remainingAmount: Number(update.payment.remainingAmount) || order.payment.remainingAmount,
        paymentMethod: update.payment.paymentMethod || update.payment.method || order.payment.paymentMethod
      };
    }
    
    // Handle central service updates
    if (update.isCentralService !== undefined) {
      order.isCentralService = update.isCentralService;
      
      if (update.isCentralService) {
        order.centralService = {
          partPrices: Number(update.centralPartPrices) || 0,
          serviceFee: Number(update.centralServiceFee) || 0,
          branchServiceFee: Number(update.branchServiceFee) || 0
        };
        order.branchService = undefined;
      } else {
        order.branchService = {
          centralPartPayment: Number(update.centralPartPayment) || 0,
          branchPartProfit: Number(update.branchPartProfit) || 0,
          branchServiceFee: Number(update.branchServiceFee) || 0
        };
        order.centralService = undefined;
      }
    }
    
    // Handle other field updates
    if (update.notes) order.notes = update.notes;
    if (update.deviceLeftForService !== undefined) order.deviceLeftForService = update.deviceLeftForService;
    if (update.sendToCentralService !== undefined) order.sendToCentralService = update.sendToCentralService;
    if (update.branchSnapshot) order.branchSnapshot = update.branchSnapshot;
    
    // Update timestamp
    order.updatedAt = new Date();

    await order.save();

    console.log('Order updated successfully:', order._id);

    res.json({ 
      success: true, 
      message: 'Order updated successfully', 
      order: {
        _id: order._id,
        orderNumber: order.orderId,
        status: order.status,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating order', 
      error: error.message 
    });
  }
});

module.exports = router;
