const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Marka adı gereklidir'],
    trim: true,
    maxlength: [100, 'Marka adı 100 karakterden uzun olamaz']
  },
  icon: {
    type: String,
    required: [true, 'İkon gereklidir'],
    trim: true,
    default: '🍎'
  },
  deviceType: {
    type: String,
    trim: true
  },
  deviceTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeviceType'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Açıklama 500 karakterden uzun olamaz']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    email: {
      type: String,
      required: true
    },
    fullName: {
      type: String,
      required: true
    }
  }
}, {
  timestamps: true
});

// Index for faster queries
brandSchema.index({ deviceType: 1, name: 1, isActive: 1 });
brandSchema.index({ deviceTypeId: 1, name: 1, isActive: 1 });
brandSchema.index({ isActive: 1, createdAt: -1 });

// Validation: Either deviceType or deviceTypeId must be provided
brandSchema.pre('save', function(next) {
  if (!this.deviceType && !this.deviceTypeId) {
    next(new Error('Either deviceType or deviceTypeId must be provided'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Brand', brandSchema); 