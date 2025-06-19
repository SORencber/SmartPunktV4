const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  items: [{
    name: String,
    quantity: Number,
    unitPrice: Number,
    total: Number
  }],
  serviceFee: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  pdfUrl: {
    type: String
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  }
});

module.exports = mongoose.model('Invoice', InvoiceSchema); 