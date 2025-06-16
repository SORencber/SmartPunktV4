const mongoose = require('mongoose');

const deviceTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Cihaz türü adı gereklidir'],
    trim: true,
    maxlength: [50, 'Cihaz türü adı 50 karakterden uzun olamaz']
  },
  icon: {
    type: String,
    required: [true, 'İkon gereklidir'],
    trim: true,
    default: 'Package'
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
deviceTypeSchema.index({ name: 1, isActive: 1 });
deviceTypeSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model('DeviceType', deviceTypeSchema); 