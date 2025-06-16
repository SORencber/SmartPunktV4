const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: false,
    unique: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  managerName: {
    type: String,
    required: true
  },
  isCentral: {
    type: Boolean,
    default: false
  },
  address: {
    street: {
      type: String,
      required: false,
      default: ''
    },
    city: {
      type: String,
      required: false,
      default: ''
    },
    state: {
      type: String,
      required: false,
      default: ''
    },
    country: {
      type: String,
      required: false,
      default: ''
    },
    postalCode: {
      type: String,
      required: false,
      default: ''
    }
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  defaultLanguage: {
    type: String,
    enum: ['tr', 'de', 'en'],
    default: 'tr'
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

// Otomatik kod oluşturma middleware'i
branchSchema.pre('save', async function(next) {
  if (!this.code) {
    // İlk 3 harfi al ve büyük harfe çevir
    const prefix = this.name.substring(0, 3).toUpperCase();
    // Rastgele 3 rakam ekle
    const randomNum = Math.floor(Math.random() * 900) + 100;
    this.code = `${prefix}${randomNum}`;
  }
  next();
});

// Indexes
branchSchema.index({ name: 1 });
branchSchema.index({ isCentral: 1 });

const Branch = mongoose.model('Branch', branchSchema);

module.exports = Branch;
