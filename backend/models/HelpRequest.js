const mongoose = require('mongoose');

const helpRequestSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    maxlength: 100
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: 2000
  },
  helpType: {
    type: String,
    enum: ['medical', 'flood', 'fire', 'lost_person', 'food', 'shelter', 'financial', 'other'],
    required: true
  },
  location: {
    division: { type: String, required: true },
    district: { type: String, required: true },
    upazila: { type: String, default: '' },
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null }
    }
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'expired'],
    default: 'active'
  },
  urgency: {
    type: String,
    enum: ['immediate', 'within_hours', 'within_days'],
    default: 'immediate'
  },
  helpers: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, default: '' },
    offeredAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['offered', 'accepted', 'completed'], default: 'offered' }
  }],
  viewCount: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    required: true
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  resolvedNote: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

helpRequestSchema.index({ status: 1, 'location.district': 1, urgency: 1, createdAt: -1 });
helpRequestSchema.index({ requester: 1, status: 1 });
helpRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('HelpRequest', helpRequestSchema);
