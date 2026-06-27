const mongoose = require('mongoose');

const featuredContentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
  curatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    enum: ['editor_pick', 'trending', 'community', 'breaking', 'promoted', 'custom'],
    default: 'editor_pick',
  },
  title: {
    type: String,
    default: '',
    maxlength: 200,
  },
  description: {
    type: String,
    default: '',
    maxlength: 500,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  priority: {
    type: Number,
    default: 0,
  },
  startsAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  displayCount: {
    type: Number,
    default: 0,
  },
  clickCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

featuredContentSchema.index({ isActive: 1, priority: -1 });
featuredContentSchema.index({ category: 1 });
featuredContentSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('FeaturedContent', featuredContentSchema);
