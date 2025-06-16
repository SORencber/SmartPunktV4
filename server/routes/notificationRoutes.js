const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');

// Şubenin okunmamış bildirimlerini getir
router.get('/unread', authenticateToken, async (req, res) => {
  try {
    const branchId = req.user.branch;
    
    const notifications = await Notification.find({
      branchId,
      isRead: false
    })
    .sort({ createdAt: -1 })
    .populate('partId', 'name category')
    .limit(50);

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Bildirimler alınırken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirimler alınırken bir hata oluştu'
    });
  }
});

// Bildirimi okundu olarak işaretle
router.post('/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const branchId = req.user.branch;

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        branchId,
        isRead: false
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Bildirim bulunamadı'
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Bildirim güncellenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirim güncellenirken bir hata oluştu'
    });
  }
});

// Tüm bildirimleri okundu olarak işaretle
router.post('/read-all', authenticateToken, async (req, res) => {
  try {
    const branchId = req.user.branch;

    const result = await Notification.updateMany(
      {
        branchId,
        isRead: false
      },
      { isRead: true }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} bildirim okundu olarak işaretlendi`
    });
  } catch (error) {
    console.error('Bildirimler güncellenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirimler güncellenirken bir hata oluştu'
    });
  }
});

module.exports = router; 