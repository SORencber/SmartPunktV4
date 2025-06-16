const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['Computer', 'Tablet', 'iPad', 'Phone', 'Other'],
    trim: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  part: {
    type: String,
    required: true,
    trim: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  descriptions: {
    tr: { type: String, required: true },
    de: { type: String, required: true },
    en: { type: String, required: true }
  },
  specifications: {
    tr: { type: String },
    de: { type: String },
    en: { type: String }
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  warrantyEligible: {
    type: Boolean,
    default: true
  },
  warrantyTerms: {
    tr: { type: String },
    de: { type: String },
    en: { type: String }
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
productSchema.index({ branchId: 1, type: 1, brand: 1, model: 1, part: 1 }, { unique: true });
productSchema.index({ branchId: 1 });
productSchema.index({ type: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ model: 1 });
productSchema.index({ status: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
