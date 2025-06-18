const mongoose = require('mongoose');

const repairSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  customer: {
    name: String,
    phone: String,
    email: String,
    address: String,
    preferredLanguage: {
      type: String,
      enum: ['TR', 'DE', 'EN', 'tr', 'de', 'en'],
      default: 'TR'
    }
  },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  device: {
    deviceTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeviceType', required: true },
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
    modelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Model', required: true },
    serialNumber: String,
    condition: String
  },
  loanedDevice: {
    deviceTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeviceType' },
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
    modelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Model' },
    names: {
      deviceType: String,
      brand: String,
      model: String
    }
  },
  isLoanedDeviceGiven: { type: Boolean, default: false },
  items: [{ type: mongoose.Schema.Types.Mixed }],
  parts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Part' }],
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'closed'],
    default: 'pending'
  },
  statusHistory: [{
    status: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now },
    notes: { type: String }
  }],
  payment: {
    totalAmount: { type: Number, required: true, min: 0 },
    depositAmount: { type: Number, default: 0, min: 0 },
    paidAmount: { type: Number, required: true, min: 0, default: 0 },
    remainingAmount: { type: Number, required: true, min: 0 },
    centralPayment: { type: Number, default: 0, min: 0 },
    paymentMethod: { type: String, enum: ['cash', 'credit_card', 'bank_transfer', 'other'], required: true },
    paymentDueDate: Date,
    paymentHistory: [{
      amount: Number,
      method: String,
      date: Date,
      reference: String
    }]
  },
  warranty: {
    issued: { type: Boolean, default: false },
    certificateNumber: String,
    issueDate: Date,
    expiryDate: Date,
    terms: {
      tr: String,
      de: String,
      en: String
    }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notes: {
    tr: String,
    de: String,
    en: String
  },
  cancellationReason: {
    tr: String,
    de: String,
    en: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isCentralService: { type: Boolean, required: true },
  centralService: {
    partPrices: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 },
    branchServiceFee: { type: Number, default: 0 }
  },
  branchService: {
    centralPartPayment: { type: Number, default: 0 },
    branchPartProfit: { type: Number, default: 0 },
    branchServiceFee: { type: Number, default: 0 }
  },
  totalCentralPayment: { type: Number, default: 0 },
  totalBranchProfit: { type: Number, default: 0 },
  branchSnapshot: {
    type: Object,
    required: false,
    default: null
  },
  originalOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Repair', repairSchema); 