const express = require('express');
const router = express.Router();
const Part = require('../models/Part');
const { authenticateToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');

// Get parts by model, brand and device type
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { modelId, brandId, deviceTypeId, category } = req.query;
    
    let query = { isActive: true };
    
    if (modelId) query.modelId = modelId;
    if (brandId) query.brandId = brandId;
    if (deviceTypeId) query.deviceTypeId = deviceTypeId;
    if (category) query.category = category;

    const parts = await Part.find(query)
      .populate('modelId', 'name')
      .populate('brandId', 'name')
      .populate('deviceTypeId', 'name')
      .sort({ category: 1, 'name.tr': 1 });
    
    logger.info('Parts fetched successfully', {
      userId: req.user.userId,
      modelId,
      brandId,
      deviceTypeId,
      category,
      count: parts.length
    });

    res.json({
      success: true,
      data: parts
    });
  } catch (error) {
    logger.error('Error fetching parts', {
      error: error.message,
      userId: req.user.userId
    });
    res.status(500).json({
      success: false,
      message: 'Parçalar yüklenirken hata oluştu'
    });
  }
});

// Get part by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const part = await Part.findById(req.params.id)
      .populate('modelId', 'name')
      .populate('brandId', 'name')
      .populate('deviceTypeId', 'name');

    if (!part) {
      return res.status(404).json({
        success: false,
        message: 'Parça bulunamadı'
      });
    }

    logger.info('Part fetched successfully', {
      userId: req.user.userId,
      partId: req.params.id
    });

    res.json({
      success: true,
      data: part
    });
  } catch (error) {
    logger.error('Error fetching part', {
      error: error.message,
      userId: req.user.userId,
      partId: req.params.id
    });
    res.status(500).json({
      success: false,
      message: 'Parça yüklenirken hata oluştu'
    });
  }
});

// Create part
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      description,
      modelId,
      brandId,
      deviceTypeId,
      category,
      barcode,
      qrCode
    } = req.body;

    // Validate required fields
    if (!name?.tr || !name?.de || !name?.en || !modelId || !brandId || !deviceTypeId || !category) {
      return res.status(400).json({
        success: false,
        message: 'Gerekli alanlar eksik'
      });
    }

    // Check if part already exists
    const existingPart = await Part.findOne({
      modelId,
      brandId,
      deviceTypeId,
      category,
      isActive: true
    });

    if (existingPart) {
      return res.status(400).json({
        success: false,
        message: 'Bu model için bu parça zaten mevcut'
      });
    }

    const part = new Part({
      name,
      description,
      modelId,
      brandId,
      deviceTypeId,
      category,
      barcode,
      qrCode,
      createdBy: {
        id: req.user._id,
        email: req.user.email,
        fullName: req.user.fullName || req.user.username
      }
    });

    await part.save();

    logger.info('Part created successfully', {
      userId: req.user.userId,
      partId: part._id
    });

    res.status(201).json({
      success: true,
      data: part
    });
  } catch (error) {
    logger.error('Error creating part', {
      error: error.message,
      userId: req.user.userId
    });
    res.status(500).json({
      success: false,
      message: 'Parça oluşturulurken hata oluştu'
    });
  }
});

// Update part
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      barcode,
      qrCode,
      isActive,
      cost,
      margin,
      minStockLevel,
      shelfNumber,
      price,
      stock,
      modelId,
      brandId,
      deviceTypeId,
      model,
      brand,
      deviceType,
      serviceFee
    } = req.body;

    // Find the part and update it in one operation
    const updatedPart = await Part.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...(name && { name }),
          ...(description && { description }),
          ...(category && { category }),
          ...(barcode && { barcode }),
          ...(qrCode && { qrCode }),
          ...(typeof isActive === 'boolean' && { isActive }),
          ...(cost && {
            cost: {
              amount: Number(cost.amount),
              currency: 'EUR'
            }
          }),
          ...(typeof margin === 'number' && { margin }),
          ...(typeof minStockLevel === 'number' && { minStockLevel }),
          ...(shelfNumber !== undefined && { shelfNumber: String(shelfNumber) }),
          ...(price && {
            price: {
              amount: Number(price.amount),
              currency: 'EUR'
            }
          }),
          ...(serviceFee && {
            serviceFee: {
              amount: Number(serviceFee.amount),
              currency: 'EUR'
            }
          }),
          ...(typeof stock === 'number' && { stock }),
          ...(modelId && { modelId }),
          ...(brandId && { brandId }),
          ...(deviceTypeId && { deviceTypeId }),
          ...(model && { model }),
          ...(brand && { brand }),
          ...(deviceType && { deviceType }),
          updatedBy: {
            id: req.user._id,
            email: req.user.email,
            fullName: req.user.fullName || req.user.username
          }
        }
      },
      { 
        new: true, // Return the updated document
        runValidators: true // Run schema validators
      }
    );

    if (!updatedPart) {
      return res.status(404).json({
        success: false,
        message: 'Parça bulunamadı'
      });
    }

    logger.info('Part updated successfully', {
      userId: req.user.userId,
      partId: updatedPart._id,
      updatedFields: Object.keys(req.body)
    });

    res.json({
      success: true,
      data: updatedPart
    });
  } catch (error) {
    logger.error('Error updating part', {
      error: error.message,
      userId: req.user.userId,
      partId: req.params.id
    });
    res.status(500).json({
      success: false,
      message: 'Parça güncellenirken hata oluştu: ' + error.message
    });
  }
});

// Delete part (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const part = await Part.findById(req.params.id);

    if (!part) {
      return res.status(404).json({
        success: false,
        message: 'Parça bulunamadı'
      });
    }

    part.isActive = false;
    await part.save();

    logger.info('Part deleted successfully', {
      userId: req.user.userId,
      partId: part._id
    });

    res.json({
      success: true,
      message: 'Parça başarıyla silindi'
    });
  } catch (error) {
    logger.error('Error deleting part', {
      error: error.message,
      userId: req.user.userId,
      partId: req.params.id
    });
    res.status(500).json({
      success: false,
      message: 'Parça silinirken hata oluştu'
    });
  }
});

module.exports = router; 