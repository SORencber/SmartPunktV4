const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['PART_UPDATE', 'PART_CREATE'],
    required: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  partId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Part',
    required: true
  },
  message: {
    tr: String,
    de: String,
    en: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdBy: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    email: String,
    fullName: String
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ branchId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 