const mongoose = require('mongoose');

// Schema definition
const branchPartSchema = new mongoose.Schema({
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  },
  modelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Model',
    required: true
  },
  deviceTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeviceType',
    required: true
  },
  name: {
    tr: { type: String, required: true },
    de: { type: String, required: true },
    en: { type: String, required: true }
  },
  description: {
    tr: { type: String },
    de: { type: String },
    en: { type: String }
  },
  category: {
    type: String,
    required: true
  },
  barcode: String,
  qrCode: String,
  compatibleWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Model'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  branch_stock: Number,
  branch_minStockLevel: Number,
  branch_cost: Number,
  branch_price: Number,
  branch_margin: Number,
  branch_shelfNumber: String,
  branch_serviceFee: {
    amount: Number,
    currency: String
  }
}, {
  timestamps: true,
  strict: false // Tüm Part alanlarını ve branch alanlarını dinamik olarak kabul et
});

// Şube özel alanları için varsayılan değerler
branchPartSchema.pre('save', function(next) {
  // Şube özel alanları için varsayılan değerler
  this.branch_stock = this.branch_stock || 0;
  this.branch_minStockLevel = this.branch_minStockLevel || 5;
  this.branch_cost = this.branch_cost || 0;
  this.branch_price = this.branch_price || 0;
  this.branch_margin = this.branch_margin || 20;
  this.branch_shelfNumber = this.branch_shelfNumber || "0";
  if (!this.branch_serviceFee) {
    this.branch_serviceFee = { amount: 0, currency: 'EUR' };
  }
  // Branch margin hesaplama
  if (this.isModified('branch_cost') || this.isModified('branch_price')) {
    if (this.branch_cost > 0) {
      this.branch_margin = ((this.branch_price - this.branch_cost) / this.branch_cost) * 100;
    }
  }
  next();
});

// Indexes
branchPartSchema.index({ _id: 1 }, { unique: true });
branchPartSchema.index({ isActive: 1 });
branchPartSchema.index({ branch_shelfNumber: 1 });
branchPartSchema.index({ compatibleWith: 1 });
branchPartSchema.index({ category: 1 });
branchPartSchema.index({ brandId: 1, modelId: 1, deviceTypeId: 1 });
branchPartSchema.index({ barcode: 1 }, { sparse: true });
branchPartSchema.index({ qrCode: 1 }, { sparse: true });

// Dynamic model creation function
const getBranchPartModel = (branchId) => {
  const collectionName = `branch_${branchId}_parts`;
  
  // Return existing model if it exists
  if (mongoose.models[collectionName]) {
    return mongoose.models[collectionName];
  }
  
  // Create new model
  return mongoose.model(collectionName, branchPartSchema, collectionName);
};

module.exports = {
  getBranchPartModel,
  branchPartSchema
}; 