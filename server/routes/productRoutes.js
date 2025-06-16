const express = require('express');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const router = express.Router();

// Get all products with pagination and filtering
router.get('/', protect, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      type, 
      status = 'active',
      branchId 
    } = req.query;

    let matchConditions = {};

    // Branch filtering - Admin can see all products, others only their branch
    if (req.user.role === 'admin') {
      // Admin can filter by specific branch or see all products
      if (branchId && branchId !== 'all') {
        matchConditions.branchId = branchId;
      }
      // If no branchId or branchId is 'all', admin sees all products
    } else {
      // Regular users only see their branch's products
      matchConditions.branchId = req.user.branchId;
    }

    // Status filtering
    if (status && status !== 'all') {
      matchConditions.status = status;
    }

    // Type filtering
    if (type && type !== 'all') {
      matchConditions.type = type;
    }

    // Search functionality
    if (search) {
      matchConditions.$or = [
        { brand: new RegExp(search, 'i') },
        { model: new RegExp(search, 'i') },
        { part: new RegExp(search, 'i') },
        { 'descriptions.tr': new RegExp(search, 'i') },
        { 'descriptions.en': new RegExp(search, 'i') },
        { 'descriptions.de': new RegExp(search, 'i') }
      ];
    }

    const products = await Product.find(matchConditions)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(matchConditions);

    logger.info('Products fetched successfully', {
      userId: req.user._id,
      role: req.user.role,
      page,
      limit,
      search,
      type,
      status,
      total
    });

    res.json({
      success: true,
      data: products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    logger.error('Failed to fetch products', {
      error: error.message,
      userId: req.user._id,
      query: req.query
    });
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get product by ID
router.get('/:id', protect, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // Non-admin users can only access products from their branch
    if (req.user.role !== 'admin') {
      query.branchId = req.user.branchId;
    }

    const product = await Product.findOne(query);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    logger.info('Product details fetched successfully', {
      productId: req.params.id,
      userId: req.user._id
    });

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    logger.error('Failed to fetch product details', {
      error: error.message,
      productId: req.params.id,
      userId: req.user._id
    });
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create new product
router.post('/', protect, async (req, res) => {
  try {
    const {
      type,
      brand,
      model,
      part,
      descriptions,
      specifications,
      price,
      warrantyEligible,
      warrantyTerms,
      branchId
    } = req.body;

    // Validate required fields
    if (!type || !brand || !model || !part || !descriptions || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Type, brand, model, part, descriptions, and price are required'
      });
    }

    // Validate descriptions
    if (!descriptions.tr || !descriptions.de || !descriptions.en) {
      return res.status(400).json({
        success: false,
        message: 'Descriptions for TR, DE, and EN are required'
      });
    }

    // Determine target branch - admin can specify branchId, others use their own branch
    const targetBranchId = (req.user.role === 'admin' && branchId) ? branchId : req.user.branchId;

    // Check if product already exists in the same branch
    const existingProduct = await Product.findOne({
      branchId: targetBranchId,
      type,
      brand,
      model,
      part
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product with this type, brand, model, and part already exists'
      });
    }

    const productData = {
      type,
      brand,
      model,
      part,
      branchId: targetBranchId,
      descriptions,
      specifications,
      price,
      warrantyEligible: warrantyEligible !== false,
      warrantyTerms
    };

    const product = new Product(productData);
    await product.save();

    logger.info('Product created successfully', {
      productId: product._id,
      userId: req.user._id,
      type,
      brand,
      model,
      part
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    logger.error('Failed to create product', {
      error: error.message,
      userId: req.user._id,
      body: req.body
    });
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update product
router.put('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const allowedFields = [
      'type', 'brand', 'model', 'part', 'descriptions', 
      'specifications', 'price', 'warrantyEligible', 
      'warrantyTerms', 'status'
    ];

    const updateData = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    // Check for duplicate if key fields are being updated
    if (updateData.type || updateData.brand || updateData.model || updateData.part) {
      const checkData = {
        type: updateData.type || product.type,
        brand: updateData.brand || product.brand,
        model: updateData.model || product.model,
        part: updateData.part || product.part
      };

      const existingProduct = await Product.findOne({
        branchId: product.branchId,
        ...checkData,
        _id: { $ne: req.params.id }
      });

      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product with this type, brand, model, and part already exists'
        });
      }
    }

    updateData.updatedAt = new Date();

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    logger.info('Product updated successfully', {
      productId: req.params.id,
      userId: req.user._id,
      updatedFields: Object.keys(updateData)
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    logger.error('Failed to update product', {
      error: error.message,
      productId: req.params.id,
      userId: req.user._id,
      body: req.body
    });
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete product (soft delete by setting status to inactive)
router.delete('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await Product.findByIdAndUpdate(req.params.id, {
      status: 'inactive',
      updatedAt: new Date()
    });

    logger.info('Product deleted successfully', {
      productId: req.params.id,
      userId: req.user._id
    });

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete product', {
      error: error.message,
      productId: req.params.id,
      userId: req.user._id
    });
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get distinct values for filters
router.get('/filters/options', protect, async (req, res) => {
  try {
    const types = await Product.distinct('type');
    const brands = await Product.distinct('brand');
    const models = await Product.distinct('model');

    res.json({
      success: true,
      data: {
        types,
        brands,
        models
      }
    });
  } catch (error) {
    logger.error('Failed to fetch filter options', {
      error: error.message,
      userId: req.user._id
    });
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 