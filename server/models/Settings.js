const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  businessName: { type: String, default: '' },
  businessPhone: { type: String, default: '' },
  businessEmail: { type: String, default: '' },
  businessAddress: { type: String, default: '' },
  timezone: { type: String, default: 'europe/berlin' },
  defaultLanguage: { type: String, enum: ['en', 'tr', 'de'], default: 'en' },
  defaultCurrency: { type: String, enum: ['usd', 'eur', 'try'], default: 'eur' },
  autoDetectCustomerLanguage: { type: Boolean, default: true },
  showLanguageFlags: { type: Boolean, default: true },
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    lowStock: { type: Boolean, default: true },
    orderStatus: { type: Boolean, default: true },
  },
  security: {
    twoFactorAuth: { type: Boolean, default: false },
    sessionTimeout: { type: String, enum: ['15', '30', '60', 'never'], default: '30' },
  },
  userManagement: {
    defaultUserRole: { type: String, enum: ['technician', 'staff', 'manager'], default: 'technician' },
    requireEmailVerification: { type: Boolean, default: true },
  },
  sidebarVisibility: {
    type: Object,
    default: {}
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

settingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Settings', settingsSchema); 