const mongoose = require('mongoose');

const keywordBlacklistSchema = new mongoose.Schema(
  {
    keyword: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [' profanity', 'slur', 'spam', 'harassment', 'hate', 'custom'],
      default: 'custom',
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    action: {
      type: String,
      enum: ['flag', 'block', 'replace'],
      default: 'flag',
    },
    replacement: {
      type: String,
      default: '***',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    hitCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

keywordBlacklistSchema.index({ keyword: 1 });

module.exports = mongoose.model('KeywordBlacklist', keywordBlacklistSchema);
