const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
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
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  device: {
    deviceTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeviceType',
      required: true
    },
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
    serialNumber: String,
    condition: String
  },
  // Information about temporary/loaned device, if provided
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
  isLoanedDeviceGiven: {
    type: Boolean,
    default: false
  },
  items: [{
    type: mongoose.Schema.Types.Mixed   // Allow flexible line-item structure
  }],
  // Selected spare parts (IDs) for this order
  parts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Part'
  }],
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
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    depositAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    paidAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    remainingAmount: {
      type: Number,
      required: true,
      min: 0
    },
    centralPayment: {            // amount to be paid to central service if applicable
      type: Number,
      default: 0,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'credit_card', 'bank_transfer', 'other'],
      required: true
    },
    paymentDueDate: Date,
    paymentHistory: [{
      amount: Number,
      method: String,
      date: Date,
      reference: String
    }]
  },
  warranty: {
    issued: {
      type: Boolean,
      default: false
    },
    certificateNumber: String,
    issueDate: Date,
    expiryDate: Date,
    terms: {
      tr: String,
      de: String,
      en: String
    }
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
  cancellationReason: {
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
  },
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
    type: Object, // Şube adres, telefon, isim, vs. snapshot'ı
    required: false,
    default: null
  }
}, {
  timestamps: true
});

// Generate unique order ID before saving
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderId = `${year}${month}${day}-${random}`;
  }
  next();
});

// Calculate remaining amount before saving
orderSchema.pre('save', function(next) {
  this.payment.remainingAmount = this.payment.totalAmount - this.payment.paidAmount;
  next();
});

// Indexes
orderSchema.index({ orderId: 1 });
orderSchema.index({ branch: 1 });
orderSchema.index({ customer: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'warranty.expiryDate': 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
