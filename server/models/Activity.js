const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: {
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
  },
  action: {
    type: String,
    required: true,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  },
  endpoint: {
    type: String,
    required: true
  },
  status: {
    type: Number,
    required: true
  },
  details: {
    requestBody: mongoose.Schema.Types.Mixed,
    responseData: mongoose.Schema.Types.Mixed
  },
  ip: String,
  userAgent: String
}, {
  timestamps: true
});

// Indexes for faster queries
activitySchema.index({ 'user.id': 1, createdAt: -1 });
activitySchema.index({ action: 1, endpoint: 1 });
activitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema); 