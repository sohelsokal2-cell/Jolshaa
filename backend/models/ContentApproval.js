const mongoose = require('mongoose');

const contentApprovalSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['ad', 'boost', 'page_verification', 'group_creation', 'sponsored_post'],
    required: true,
  },
  targetType: {
    type: String,
    enum: ['Post', 'Ad', 'Page', 'Group'],
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'needs_info'],
    default: 'pending',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  adminNote: {
    type: String,
    default: '',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, { timestamps: true });

contentApprovalSchema.index({ type: 1, status: 1 });
contentApprovalSchema.index({ targetType: 1, targetId: 1 });
contentApprovalSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('ContentApproval', contentApprovalSchema);
