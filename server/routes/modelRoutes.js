const express = require('express');
const router = express.Router();
const Model = require('../models/Model');
const { authenticateToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const mongoose = require('mongoose');

// Get models by brand and device type
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { brand, brandId, deviceType, deviceTypeId } = req.query;
    
    let query = { isActive: true };
    
    // Support both legacy string fields and new ObjectId fields
    if (brandId) {
      query.brandId = brandId;
    } else if (brand) {
      query.brand = brand;
    }
    
    if (deviceTypeId) {
      query.deviceTypeId = deviceTypeId;
    } else if (deviceType) {
      query.deviceType = deviceType;
    }

    const models = await Model.find(query).sort({ name: 1 });
    
    logger.info('Models fetched successfully', {
      userId: req.user._id,
      brand: brand || brandId,
      deviceType: deviceType || deviceTypeId,
      count: models.length
    });

    res.json({
      success: true,
      data: models
    });
  } catch (error) {
    logger.error('Error fetching models', {
      error: error.message,
      userId: req.user._id
    });
    res.status(500).json({
      success: false,
      message: 'Modeller yüklenirken hata oluştu'
    });
  }
});

// Create model
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, icon, brand, brandId, deviceType, deviceTypeId, description } = req.body;

    // Validate required fields
    if (!name || !icon) {
      return res.status(400).json({
        success: false,
        message: 'Model adı ve ikon gereklidir'
      });
    }

    // Validate brand and device type IDs
    if (!brandId || !deviceTypeId) {
      return res.status(400).json({
        success: false,
        message: 'Marka ve cihaz türü seçimi zorunludur'
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(brandId) || !mongoose.Types.ObjectId.isValid(deviceTypeId)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz marka veya cihaz türü ID formatı'
      });
    }

    // Check if model already exists for this brand and device type
    const existingModel = await Model.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      brandId,
      deviceTypeId,
      isActive: true
    });

    if (existingModel) {
      return res.status(400).json({
        success: false,
        message: 'Bu marka ve cihaz türü için bu model zaten mevcut'
      });
    }

    const modelData = {
      name: name.trim(),
      icon: icon.trim(),
      brandId,
      deviceTypeId,
      description: description ? description.trim() : '',
      createdBy: {
        id: req.user._id,
        email: req.user.email,
        fullName: req.user.fullName || req.user.username
      }
    };

    const model = new Model(modelData);
    await model.save();

    logger.info('Model created successfully', {
      userId: req.user._id,
      modelId: model._id,
      name: model.name,
      brand: model.brand,
      deviceType: model.deviceType
    });

    res.status(201).json({
      success: true,
      data: model,
      message: 'Model başarıyla oluşturuldu'
    });
  } catch (error) {
    logger.error('Error creating model', {
      error: error.message,
      userId: req.user._id,
      stack: error.stack,
      body: req.body
    });

    // Handle specific mongoose errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(err => err.message).join(', ')
      });
    }

    if (error.name === 'MongoError' && error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bu model adı zaten kullanılıyor'
      });
    }

    // Handle custom errors from pre-save middleware
    if (error.message.includes('not found')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Model oluşturulurken bir hata oluştu'
    });
  }
});

// Update model
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, icon, brand, brandId, deviceType, deviceTypeId, description } = req.body;
    const { id } = req.params;

    if (!name || !icon) {
      return res.status(400).json({
        success: false,
        message: 'Model adı ve ikon gereklidir'
      });
    }

    if (!brand || !deviceType) {
      return res.status(400).json({
        success: false,
        message: 'Model adı, marka ve cihaz türü gereklidir'
      });
    }

    // Check if another model with same name exists for this brand and device type
    const existingModel = await Model.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      brand,
      deviceType,
      isActive: true
    });

    if (existingModel) {
      return res.status(400).json({
        success: false,
        message: 'Bu marka ve cihaz türü için bu model adı zaten kullanılıyor'
      });
    }

    const model = await Model.findByIdAndUpdate(
      id,
      {
        name,
        icon,
        brand: brand || '',
        brandId: brandId || null,
        deviceType: deviceType || '',
        deviceTypeId: deviceTypeId || null,
        description: description || '',
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!model) {
      return res.status(404).json({
        success: false,
        message: 'Model bulunamadı'
      });
    }

    logger.info('Model updated successfully', {
      userId: req.user._id,
      modelId: model._id,
      name: model.name
    });

    res.json({
      success: true,
      data: model,
      message: 'Model başarıyla güncellendi'
    });
  } catch (error) {
    logger.error('Error updating model', {
      error: error.message,
      userId: req.user._id,
      modelId: req.params.id
    });
    res.status(500).json({
      success: false,
      message: 'Model güncellenirken hata oluştu'
    });
  }
});

// Delete model (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const model = await Model.findByIdAndUpdate(
      id,
      {
        isActive: false,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!model) {
      return res.status(404).json({
        success: false,
        message: 'Model bulunamadı'
      });
    }

    logger.info('Model deleted successfully', {
      userId: req.user._id,
      modelId: model._id,
      name: model.name
    });

    res.json({
      success: true,
      message: 'Model başarıyla silindi'
    });
  } catch (error) {
    logger.error('Error deleting model', {
      error: error.message,
      userId: req.user._id,
      modelId: req.params.id
    });
    res.status(500).json({
      success: false,
      message: 'Model silinirken hata oluştu'
    });
  }
});

module.exports = router; 