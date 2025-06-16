const mongoose = require('mongoose');

const modelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Model adı zorunludur'],
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: [true, 'Marka ID zorunludur']
  },
  deviceType: {
    type: String,
    trim: true
  },
  deviceTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeviceType',
    required: [true, 'Cihaz türü ID zorunludur']
  },
  icon: {
    type: String,
    required: [true, 'İkon gereklidir'],
    default: 'phone',
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
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

// Compound index for unique model names per brand and device type
modelSchema.index({ brandId: 1, deviceTypeId: 1, name: 1 }, { unique: true });
// Index for active models
modelSchema.index({ isActive: 1, createdAt: -1 });
// Index for brand and device type lookups
modelSchema.index({ brandId: 1, deviceTypeId: 1 });

// Pre-save middleware to ensure brand and deviceType names are set
modelSchema.pre('save', async function(next) {
  try {
    if (this.isModified('brandId')) {
      const Brand = mongoose.model('Brand');
      const brand = await Brand.findById(this.brandId);
      if (!brand) {
        throw new Error(`Brand with ID ${this.brandId} not found`);
      }
      this.brand = typeof brand.name === 'string' ? brand.name : (brand.name?.tr || brand.name?.en || brand.name?.de || '');
    }
    
    if (this.isModified('deviceTypeId')) {
      const DeviceType = mongoose.model('DeviceType');
      const deviceType = await DeviceType.findById(this.deviceTypeId);
      if (!deviceType) {
        throw new Error(`DeviceType with ID ${this.deviceTypeId} not found`);
      }
      this.deviceType = typeof deviceType.name === 'string' ? deviceType.name : (deviceType.name?.tr || deviceType.name?.en || deviceType.name?.de || '');
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

const Model = mongoose.model('Model', modelSchema);

module.exports = Model; 