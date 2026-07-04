const mongoose = require('mongoose');

const videoViewSchema = new mongoose.Schema({
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
  viewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  watchedSeconds: {
    type: Number,
    default: 0,
  },
  watchedPercentage: {
    type: Number,
    default: 0,
  },
  completedView: {
    type: Boolean,
    default: false,
  },
  device: {
    type: String,
    enum: ['mobile', 'desktop', 'tablet'],
    default: 'desktop',
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

videoViewSchema.index({ video: 1, viewer: 1 });
videoViewSchema.index({ video: 1, createdAt: -1 });
videoViewSchema.index({ viewer: 1, createdAt: -1 });

module.exports = mongoose.model('VideoView', videoViewSchema);
