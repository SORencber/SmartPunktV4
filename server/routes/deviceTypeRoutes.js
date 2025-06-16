const express = require('express');
const router = express.Router();
const DeviceType = require('../models/DeviceType');
const { authenticateToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');

// Get all device types
router.get('/', authenticateToken, async (req, res) => {
  try {
    const deviceTypes = await DeviceType.find({ isActive: true }).sort({ name: 1 });
    
    logger.info('Device types fetched successfully', {
      userId: req.user.userId,
      count: deviceTypes.length
    });

    res.json({
      success: true,
      data: deviceTypes
    });
  } catch (error) {
    logger.error('Error fetching device types', {
      error: error.message,
      userId: req.user.userId
    });
    res.status(500).json({
      success: false,
      message: 'Cihaz türleri yüklenirken hata oluştu'
    });
  }
});

// Create device type
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, icon, description } = req.body;

    if (!name || !icon) {
      return res.status(400).json({
        success: false,
        message: 'Cihaz türü adı ve ikon gereklidir'
      });
    }

    // Check if device type already exists
    const existingDeviceType = await DeviceType.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      isActive: true
    });

    if (existingDeviceType) {
      return res.status(400).json({
        success: false,
        message: 'Bu cihaz türü zaten mevcut'
      });
    }

    const deviceType = new DeviceType({
      name,
      icon,
      description: description || '',
      createdBy: {
        id: req.user.userId,
        email: req.user.email,
        fullName: req.user.fullName || req.user.username
      }
    });

    await deviceType.save();

    logger.info('Device type created successfully', {
      userId: req.user.userId,
      deviceTypeId: deviceType._id,
      name: deviceType.name
    });

    res.status(201).json({
      success: true,
      data: deviceType,
      message: 'Cihaz türü başarıyla oluşturuldu'
    });
  } catch (error) {
    logger.error('Error creating device type', {
      error: error.message,
      userId: req.user.userId
    });
    res.status(500).json({
      success: false,
      message: 'Cihaz türü oluşturulurken hata oluştu'
    });
  }
});

// Update device type
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    const { id } = req.params;

    if (!name || !icon) {
      return res.status(400).json({
        success: false,
        message: 'Cihaz türü adı ve ikon gereklidir'
      });
    }

    // Check if another device type with same name exists
    const existingDeviceType = await DeviceType.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      isActive: true
    });

    if (existingDeviceType) {
      return res.status(400).json({
        success: false,
        message: 'Bu cihaz türü adı zaten kullanılıyor'
      });
    }

    const deviceType = await DeviceType.findByIdAndUpdate(
      id,
      {
        name,
        icon,
        description: description || '',
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!deviceType) {
      return res.status(404).json({
        success: false,
        message: 'Cihaz türü bulunamadı'
      });
    }

    logger.info('Device type updated successfully', {
      userId: req.user.userId,
      deviceTypeId: deviceType._id,
      name: deviceType.name
    });

    res.json({
      success: true,
      data: deviceType,
      message: 'Cihaz türü başarıyla güncellendi'
    });
  } catch (error) {
    logger.error('Error updating device type', {
      error: error.message,
      userId: req.user.userId,
      deviceTypeId: req.params.id
    });
    res.status(500).json({
      success: false,
      message: 'Cihaz türü güncellenirken hata oluştu'
    });
  }
});

// Delete device type (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const deviceType = await DeviceType.findByIdAndUpdate(
      id,
      {
        isActive: false,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!deviceType) {
      return res.status(404).json({
        success: false,
        message: 'Cihaz türü bulunamadı'
      });
    }

    logger.info('Device type deleted successfully', {
      userId: req.user.userId,
      deviceTypeId: deviceType._id,
      name: deviceType.name
    });

    res.json({
      success: true,
      message: 'Cihaz türü başarıyla silindi'
    });
  } catch (error) {
    logger.error('Error deleting device type', {
      error: error.message,
      userId: req.user.userId,
      deviceTypeId: req.params.id
    });
    res.status(500).json({
      success: false,
      message: 'Cihaz türü silinirken hata oluştu'
    });
  }
});

module.exports = router; 