const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a role name'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  permissions: [{
    module: {
      type: String,
      enum: [
        'dashboard',
        'customers',
        'orders',
        'repairs',
        'finances',
        'warranties',
        'reports',
        'settings',
        'users',
        'branches',
        'roles'
      ],
      required: true
    },
    actions: [{
      type: String,
      enum: ['create', 'read', 'update', 'delete', 'approve', 'reject', 'export', 'import'],
      required: true
    }]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isSystem: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
roleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes
roleSchema.index({ name: 1 }, { unique: true });

const Role = mongoose.model('Role', roleSchema);

module.exports = Role; 