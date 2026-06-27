const mongoose = require('mongoose');

const guidelineViolationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetType: {
      type: String,
      enum: ['post', 'comment', 'message', 'group', 'page', 'event', 'profile'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    guideline: {
      type: String,
      enum: ['spam', 'harassment', 'hate_speech', 'violence', 'nudity', 'misinformation', 'copyright', 'scam', 'self_harm', 'other'],
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    action: {
      type: String,
      enum: ['warning', 'content_restriction', 'account_restriction', 'ban', 'none'],
      default: 'none',
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['active', 'appealed', 'expired', 'revoked'],
      default: 'active',
    },
    expiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

guidelineViolationSchema.index({ user: 1, createdAt: -1 });
guidelineViolationSchema.index({ status: 1 });

module.exports = mongoose.model('GuidelineViolation', guidelineViolationSchema);
