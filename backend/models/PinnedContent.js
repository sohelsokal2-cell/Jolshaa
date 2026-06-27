const mongoose = require('mongoose');

const pinnedContentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
  pinnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  scope: {
    type: String,
    enum: ['global', 'profile', 'group', 'page'],
    default: 'global',
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'scopeModel',
    default: null,
  },
  scopeModel: {
    type: String,
    enum: ['User', 'Group', 'Page', null],
    default: null,
  },
  reason: {
    type: String,
    default: '',
    maxlength: 200,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

pinnedContentSchema.index({ scope: 1, targetId: 1, isActive: 1 });
pinnedContentSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('PinnedContent', pinnedContentSchema);
