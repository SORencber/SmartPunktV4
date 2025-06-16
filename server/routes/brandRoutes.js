const express = require('express');
const router = express.Router();
const Brand = require('../models/Brand');
const { authenticateToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');

// Get brands by device type
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { deviceType, deviceTypeId } = req.query;
    
    let query = { isActive: true };
    // Support both deviceType (string) and deviceTypeId (ObjectId) for backwards compatibility
    if (deviceTypeId) {
      query.deviceTypeId = deviceTypeId;
    } else if (deviceType) {
      query.deviceType = deviceType;
    }

    const brands = await Brand.find(query).sort({ name: 1 });
    
    logger.info('Brands fetched successfully', {
      userId: req.user.userId,
      deviceType: deviceType || deviceTypeId,
      count: brands.length
    });

    res.json({
      success: true,
      data: brands
    });
  } catch (error) {
    logger.error('Error fetching brands', {
      error: error.message,
      userId: req.user.userId
    });
    res.status(500).json({
      success: false,
      message: 'Markalar yüklenirken hata oluştu'
    });
  }
});

// Create brand
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, icon, deviceType, deviceTypeId, description } = req.body;

    if (!name || !icon) {
      return res.status(400).json({
        success: false,
        message: 'Marka adı ve ikon gereklidir'
      });
    }

    // Support both deviceType (string) and deviceTypeId (ObjectId)
    const targetDeviceType = deviceTypeId || deviceType;
    const targetDeviceTypeId = deviceTypeId;

    if (!targetDeviceType) {
      return res.status(400).json({
        success: false,
        message: 'Marka adı ve cihaz türü gereklidir'
      });
    }

    // Check if brand already exists for this device type
    let query = {
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      isActive: true
    };
    
    if (targetDeviceTypeId) {
      query.deviceTypeId = targetDeviceTypeId;
    } else {
      query.deviceType = targetDeviceType;
    }

    const existingBrand = await Brand.findOne(query);

    if (existingBrand) {
      return res.status(400).json({
        success: false,
        message: 'Bu cihaz türü için bu marka zaten mevcut'
      });
    }

    const brandData = {
      name,
      icon,
      deviceType: deviceType || '',
      deviceTypeId: deviceTypeId || null,
      description: description || '',
      createdBy: {
        id: req.user._id,
        email: req.user.email,
        fullName: req.user.fullName || req.user.username
      }
    };

    // Set the appropriate field based on what was provided
    if (targetDeviceTypeId) {
      brandData.deviceTypeId = targetDeviceTypeId;
    } else {
      brandData.deviceType = targetDeviceType;
    }

    const brand = new Brand(brandData);
    await brand.save();

    logger.info('Brand created successfully', {
      userId: req.user._id,
      brandId: brand._id,
      name: brand.name,
      deviceType: targetDeviceType
    });

    res.status(201).json({
      success: true,
      data: brand,
      message: 'Marka başarıyla oluşturuldu'
    });
  } catch (error) {
    logger.error('Error creating brand', {
      error: error.message,
      userId: req.user._id
    });
    res.status(500).json({
      success: false,
      message: 'Marka oluşturulurken hata oluştu'
    });
  }
});

// Update brand
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, icon, deviceType, deviceTypeId, description } = req.body;
    const { id } = req.params;

    if (!name || !icon) {
      return res.status(400).json({
        success: false,
        message: 'Marka adı ve ikon gereklidir'
      });
    }

    if (!deviceType) {
      return res.status(400).json({
        success: false,
        message: 'Marka adı ve cihaz türü gereklidir'
      });
    }

    // Check if another brand with same name exists for this device type
    const existingBrand = await Brand.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      deviceType,
      isActive: true
    });

    if (existingBrand) {
      return res.status(400).json({
        success: false,
        message: 'Bu cihaz türü için bu marka adı zaten kullanılıyor'
      });
    }

    const brand = await Brand.findByIdAndUpdate(
      id,
      {
        name,
        icon,
        deviceType: deviceType || '',
        deviceTypeId: deviceTypeId || null,
        description: description || '',
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Marka bulunamadı'
      });
    }

    logger.info('Brand updated successfully', {
      userId: req.user.userId,
      brandId: brand._id,
      name: brand.name
    });

    res.json({
      success: true,
      data: brand,
      message: 'Marka başarıyla güncellendi'
    });
  } catch (error) {
    logger.error('Error updating brand', {
      error: error.message,
      userId: req.user.userId,
      brandId: req.params.id
    });
    res.status(500).json({
      success: false,
      message: 'Marka güncellenirken hata oluştu'
    });
  }
});

// Delete brand (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findByIdAndUpdate(
      id,
      {
        isActive: false,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Marka bulunamadı'
      });
    }

    logger.info('Brand deleted successfully', {
      userId: req.user.userId,
      brandId: brand._id,
      name: brand.name
    });

    res.json({
      success: true,
      message: 'Marka başarıyla silindi'
    });
  } catch (error) {
    logger.error('Error deleting brand', {
      error: error.message,
      userId: req.user.userId,
      brandId: req.params.id
    });
    res.status(500).json({
      success: false,
      message: 'Marka silinirken hata oluştu'
    });
  }
});

module.exports = router; 