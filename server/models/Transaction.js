const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  category: {
    type: String,
    enum: [
      'product_sale',
      'service_charge',
      'warranty_claim',
      'operating_expense',
      'salary',
      'rent',
      'utilities',
      'other'
    ],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    enum: ['TRY', 'EUR', 'USD'],
    default: 'TRY'
  },
  description: {
    tr: String,
    de: String,
    en: String
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'bank_transfer', 'other'],
    required: true
  },
  reference: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'refunded'],
    default: 'completed'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    tr: String,
    de: String,
    en: String
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
transactionSchema.index({ branch: 1, createdAt: -1 });
transactionSchema.index({ order: 1 });
transactionSchema.index({ type: 1, category: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdBy: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction; 