const mongoose = require('mongoose');

const autoModRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: ['flag', 'hide', 'remove', 'warn', 'mute', 'ban'],
      required: true,
    },
    targetType: {
      type: String,
      enum: ['post', 'comment', 'message', 'all'],
      default: 'all',
    },
    conditions: {
      keywordMatch: { type: Boolean, default: false },
      linkMatch: { type: Boolean, default: false },
      mediaMatch: { type: Boolean, default: false },
      mentionCount: { type: Number, default: 0 },
      repetitionCount: { type: Number, default: 0 },
      accountAgeDays: { type: Number, default: 0 },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    hitCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AutoModRule', autoModRuleSchema);
