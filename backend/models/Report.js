const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    targetType: {
      type: String,
      enum: ['post', 'comment', 'user', 'story', 'message', 'reel', 'group_post', 'listing', 'note', 'poll', 'qa', 'help_request'],
      required: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'targetType'
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      enum: [
        'spam',
        'harassment',
        'hate_speech',
        'violence',
        'nudity',
        'misinformation',
        'copyright',
        'fake_account',
        'other'
      ]
    },
    description: {
      type: String,
      default: '',
      maxlength: 500
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed', 'escalated'],
      default: 'pending'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    escalationLevel: {
      type: Number,
      enum: [0, 1, 2, 3],
      default: 0
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    resolution: {
      type: String,
      enum: ['none', 'content_removed', 'warning_issued', 'account_suspended', 'account_banned', 'no_action', 'other'],
      default: 'none'
    },
    isAutoFlagged: {
      type: Boolean,
      default: false
    },
    autoFlagReason: {
      type: String,
      default: ''
    },
    evidenceUrls: [{
      type: String
    }],
    escalationHistory: [{
      escalatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      escalatedAt: { type: Date, default: Date.now },
      fromLevel: { type: Number },
      toLevel: { type: Number },
      reason: { type: String, default: '' }
    }]
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
);

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ targetType: 1, targetId: 1 });
reportSchema.index({ reporter: 1 });
reportSchema.index({ priority: 1, status: 1 });
reportSchema.index({ assignedTo: 1, status: 1 });
reportSchema.index({ escalationLevel: 1 });

module.exports = mongoose.model('Report', reportSchema);
