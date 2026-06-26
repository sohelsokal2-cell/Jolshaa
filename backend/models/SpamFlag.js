const mongoose = require('mongoose');

const spamFlagSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    contentType: {
      type: String,
      enum: ['post', 'comment', 'message', 'reel', 'listing'],
      required: true
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    contentText: {
      type: String,
      default: ''
    },
    spamType: {
      type: String,
      enum: ['auto_detected', 'user_reported', 'pattern_match', 'rate_limit', 'duplicate_content'],
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    },
    flags: [{
      type: { type: String },
      severity: { type: String, enum: ['low', 'medium', 'high'] },
      detail: { type: String, default: '' }
    }],
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'confirmed', 'dismissed'],
      default: 'pending'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

spamFlagSchema.index({ user: 1, createdAt: -1 });
spamFlagSchema.index({ status: 1, createdAt: -1 });
spamFlagSchema.index({ spamType: 1 });

module.exports = mongoose.model('SpamFlag', spamFlagSchema);
