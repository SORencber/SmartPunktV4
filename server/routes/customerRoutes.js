const express = require('express');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const router = express.Router();
const Branch = require('../models/Branch');
const { isValidObjectId } = require('../utils/validation');

// ObjectId validation middleware
const validateObjectId = (req, res, next) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'Geçersiz müşteri ID\'si'
    });
  }
  next();
};

// Get all customers with pagination and search
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const branchId = req.query.branchId;

    // Build query
    const query = {};
    
    // Add search condition if search term exists
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Add branch filter for non-admin users
    if (req.user.role !== 'admin') {
      query.branchId = req.user.branch;
    } else if (branchId) {
      query.branchId = branchId;
    }

    // Get total count for pagination
    const total = await Customer.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Get customers with pagination
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    logger.info('Customers fetched successfully', {
      userId: req.user._id,
      branchId: req.user.branch,
      role: req.user.role,
      page,
      limit,
      total,
      search: search || undefined
    });

    res.json({
      success: true,
      data: customers,
      totalPages,
      currentPage: page,
      total
    });
  } catch (error) {
    logger.error('Error fetching customers', {
      error: error.message,
      userId: req.user._id,
      branchId: req.user.branch
    });

    res.status(500).json({
      success: false,
      message: 'Müşteriler yüklenirken bir hata oluştu'
    });
  }
});

// Get customer by ID
router.get('/:id', protect, validateObjectId, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Müşteri bulunamadı'
      });
    }

    // Check if user has access to this customer
    if (req.user.role !== 'admin' && customer.branchId.toString() !== req.user.branch.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu müşteriye erişim yetkiniz yok'
      });
    }

    logger.info('Customer fetched successfully', {
      userId: req.user._id,
      customerId: req.params.id,
      branchId: req.user.branch
    });

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    logger.error('Error fetching customer', {
      error: error.message,
      userId: req.user._id,
      customerId: req.params.id
    });

    res.status(500).json({
      success: false,
      message: 'Müşteri bilgileri alınamadı'
    });
  }
});

// Create new customer
router.post('/', protect, async (req, res) => {
  try {
    const { name, email, phone, address, preferredLanguage } = req.body;
    console.log('Creating customer with data:', { 
      name, email, phone, address, preferredLanguage,
      userBranch: req.user.branch,
      userId: req.user._id
    });

    const userBranchId = req.user.branch;
    if (!userBranchId) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı şube bilgisi bulunamadı'
      });
    }

    // Generate a default name if not provided
    const customerName = name?.trim() || `SP-Customer-${Date.now()}`;

    // Check if customer already exists with same phone (only if phone is provided)
    if (phone && phone.trim() !== '') {
      const existingCustomerPhone = await Customer.findOne({
        phone,
        branchId: userBranchId
      });

      if (existingCustomerPhone) {
        return res.status(400).json({
          success: false,
          message: 'Bu telefon numarası ile kayıtlı bir müşteri zaten var'
        });
      }
    }

    // Check if email is provided and already exists
    if (email && email.trim() !== '') {
      const existingCustomerEmail = await Customer.findOne({
        email: email.trim(),
        branchId: userBranchId
      });

      if (existingCustomerEmail) {
        return res.status(400).json({
          success: false,
          message: 'Bu email adresi ile kayıtlı bir müşteri zaten var'
        });
      }
    }

    // Handle address format
    let formattedAddress;
    if (typeof address === 'string') {
      formattedAddress = {
        street: address.trim(),
        city: '',
        state: '',
        zipCode: '',
        country: 'TR'
      };
    } else if (typeof address === 'object' && address !== null) {
      formattedAddress = {
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        zipCode: address.zipCode || '',
        country: address.country || 'TR'
      };
    } else {
      formattedAddress = {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'TR'
      };
    }

    // Create new customer with optional fields
    const customerData = {
      name: customerName,
      email: email?.trim() || undefined,
      phone: phone?.trim() || undefined,
      address: formattedAddress,
      branchId: userBranchId,
      createdBy: {
        id: req.user._id,
        email: req.user.email,
        fullName: req.user.fullName
      },
      preferredLanguage: preferredLanguage || 'TR'
    };

    console.log('Attempting to create customer with data:', customerData);

    const customer = await Customer.create(customerData);

    logger.info('Customer created successfully', {
      userId: req.user._id,
      customerId: customer._id,
      branchId: req.user.branch
    });

    res.status(201).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Detailed error creating customer:', error);
    logger.error('Error creating customer', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id,
      branchId: req.user?.branch
    });

    res.status(500).json({
      success: false,
      message: 'Müşteri oluşturulurken bir hata oluştu',
      details: error.message
    });
  }
});

// Update customer
router.put('/:id', protect, validateObjectId, async (req, res) => {
  try {
    const { name, email, phone, address, preferredLanguage } = req.body;

    // Find customer
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Müşteri bulunamadı'
      });
    }

    // Check if user has access to this customer
    if (req.user.role !== 'admin' && customer.branchId.toString() !== req.user.branch.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu müşteriyi düzenleme yetkiniz yok'
      });
    }

    // Check if phone number is already used by another customer
    if (phone && phone !== customer.phone) {
      const existingCustomer = await Customer.findOne({
        phone,
        branchId: req.user.branch,
        _id: { $ne: req.params.id }
      });

      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Bu telefon numarası başka bir müşteri tarafından kullanılıyor'
        });
      }
    }

    // Check if email is already used by another customer (if email is provided and changed)
    if (email && email.trim() !== '' && email !== customer.email) {
      const existingCustomerEmail = await Customer.findOne({
        email: email.trim(),
        branchId: req.user.branch,
        _id: { $ne: req.params.id }
      });

      if (existingCustomerEmail) {
        return res.status(400).json({
          success: false,
          message: 'Bu email adresi başka bir müşteri tarafından kullanılıyor'
        });
      }
    }

    // Update customer
    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        name: name || customer.name,
        email: email !== undefined ? email : customer.email,
        phone: phone || customer.phone,
        address: address !== undefined ? address : customer.address,
        preferredLanguage: preferredLanguage || customer.preferredLanguage
      },
      { new: true, runValidators: true }
    ).lean();

    logger.info('Customer updated successfully', {
      userId: req.user._id,
      customerId: req.params.id,
      branchId: req.user.branch
    });

    res.json({
      success: true,
      data: updatedCustomer
    });
  } catch (error) {
    logger.error('Error updating customer', {
      error: error.message,
      userId: req.user._id,
      customerId: req.params.id
    });

    res.status(500).json({
      success: false,
      message: 'Müşteri güncellenirken bir hata oluştu'
    });
  }
});

// Delete customer
router.delete('/:id', protect, validateObjectId, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Müşteri bulunamadı'
      });
    }

    // Check if user has access to this customer
    if (req.user.role !== 'admin' && customer.branchId.toString() !== req.user.branch.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu müşteriyi silme yetkiniz yok'
      });
    }

    // Önce müşterinin tüm siparişlerini sil
    await Order.deleteMany({ customerId: req.params.id });

    // Sonra müşteriyi sil
    await Customer.findByIdAndDelete(req.params.id);

    logger.info('Customer and related orders deleted successfully', {
      userId: req.user._id,
      customerId: req.params.id,
      branchId: req.user.branch
    });

    res.json({
      success: true,
      message: 'Müşteri ve tüm siparişleri başarıyla silindi'
    });
  } catch (error) {
    logger.error('Error deleting customer', {
      error: error.message,
      userId: req.user._id,
      customerId: req.params.id
    });

    res.status(500).json({
      success: false,
      message: 'Müşteri silinirken bir hata oluştu'
    });
  }
});

// Add simple endpoint to attach an order reference to customer (used by frontend)
router.post('/:id/orders', protect, validateObjectId, async (req, res) => {
  try {
    const { orderId, orderNumber, barcode, orderDetails } = req.body;
    // basic validation
    if (!orderId) {
      return res.status(400).json({ success:false, message:'orderId is required'});
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success:false, message:'Customer not found'});
    }

    // Push order reference to an orders array (create if not exists)
    if (!customer.orders) customer.orders = [];
    customer.orders.push({ orderId, orderNumber, barcode, orderDetails });
    await customer.save();

    res.status(201).json({ success:true, message:'Order linked to customer' });
  } catch(err){
    res.status(500).json({ success:false, message:'Error attaching order to customer', error:err.message });
  }
});

module.exports = router;
