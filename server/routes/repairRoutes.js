const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Repair = require('../models/Repair');
const { authenticateToken } = require('../middleware/auth');
const { sendMessage, getLatestQrCode, initWhatsApp } = require('../services/messageService');
const Part = require('../models/Part');

// GET /api/repairs - list repairs (with optional filters)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search = '', status = 'all', branch, page = 1, limit = 10, customerId } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (customerId) query.customerId = customerId;
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'device.serialNumber': { $regex: search, $options: 'i' } }
      ];
    }
    // Admin can see all, others only their branch
    if (req.user.role !== 'admin') {
      query.branch = req.user.branchId;
    } else if (branch && branch !== 'all') {
      query.branch = branch;
    }
    const skip = (Number(page) - 1) * Number(limit);
    let repairs = await Repair.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('branch', 'name address');

    // Populate items.name with multilingual part name if partId exists
    for (const repair of repairs) {
      if (Array.isArray(repair.items)) {
        for (const item of repair.items) {
          if (item.partId) {
            const part = await Part.findById(item.partId).select('name');
            if (part && part.name) {
              item.name = part.name;
            }
          }
        }
      }
    }

    const total = await Repair.countDocuments(query);
    res.json({ success: true, repairs, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET /api/repairs/:id - get repair by id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const repair = await Repair.findById(req.params.id)
      .populate('customerId', 'name phone email address')
      .populate('branch', 'name address');
    if (!repair) return res.status(404).json({ success: false, message: 'Repair not found' });
    // Populate items.name with multilingual part name if partId exists
    if (Array.isArray(repair.items)) {
      for (const item of repair.items) {
        if (item.partId) {
          const part = await Part.findById(item.partId).select('name');
          if (part && part.name) {
            item.name = part.name;
          }
        }
      }
    }
    res.json({ success: true, repair });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// PUT /api/repairs/:id/status - update repair status
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const repair = await Repair.findById(req.params.id);
    if (!repair) return res.status(404).json({ success: false, message: 'Repair not found' });
    repair.status = status;
    if (!repair.statusHistory) repair.statusHistory = [];
    repair.statusHistory.push({
      status,
      user: req.user._id,
      timestamp: new Date(),
      notes: notes || `Status updated to ${status}`
    });
    await repair.save();
    res.json({ success: true, message: 'Repair status updated', repair });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// PUT /api/repairs/:id/cancel - cancel repair
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const repair = await Repair.findById(req.params.id);
    if (!repair) return res.status(404).json({ success: false, message: 'Repair not found' });
    if (repair.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Repair is already cancelled' });
    }
    repair.status = 'cancelled';
    repair.cancellationReason = reason;
    repair.statusHistory.push({
      status: 'cancelled',
      user: req.user._id,
      timestamp: new Date(),
      notes: `Repair cancelled: ${reason}`
    });
    await repair.save();
    res.json({ success: true, message: 'Repair cancelled', repair });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// DELETE /api/repairs/:id - delete repair
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const repair = await Repair.findByIdAndDelete(req.params.id);
    if (!repair) {
      return res.status(404).json({ success: false, message: 'Repair not found' });
    }
    res.json({ success: true, message: 'Repair deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// POST /api/repairs/:id/message - send message to customer
router.post('/:id/message', authenticateToken, async (req, res) => {
  try {
    const { channels, message } = req.body;
    if (!channels || !Array.isArray(channels) || !message) {
      return res.status(400).json({ success: false, message: 'channels and message are required' });
    }
    const repair = await Repair.findById(req.params.id).populate('customerId').populate('branch');
    if (!repair) return res.status(404).json({ success: false, message: 'Repair not found' });
    const customer = repair.customerId;
    const branch = repair.branch || repair.branchSnapshot || {};
    const branchInfo = { name: branch.name, address: branch.address };
    const email = customer?.email;
    const phone = customer?.phone;
    // WhatsApp: use phone number in international format
    const whatsapp = phone ? `+${phone.replace(/[^\d]/g, '')}` : undefined;
    const result = await sendMessage({
      to: customer?._id,
      channels,
      message,
      branchInfo,
      email,
      phone,
      whatsapp,
    });
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET /api/repairs/whatsapp/qr - get latest WhatsApp QR code for a user
router.get('/whatsapp/qr', (req, res) => {
  const user = req.query.user || 'default';
  // Always initialize WhatsApp client for this user
  initWhatsApp(user);
  const qr = getLatestQrCode(user);
  if (qr) {
    res.json({ success: true, qr });
  } else {
    res.json({ success: false, message: 'No QR code available' });
  }
});

module.exports = router; 