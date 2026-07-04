const mongoose = require('mongoose');

const adImpressionSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdCampaign',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    adType: {
      type: String,
      enum: ['feed', 'video_midroll', 'sidebar', 'story'],
      default: 'feed',
    },
    impressionId: {
      type: String,
      required: true,
      unique: true,
    },
    clicked: {
      type: Boolean,
      default: false,
    },
    clickedAt: Date,
    costCharged: {
      type: Number,
      default: 0,
    },
    device: {
      type: String,
      enum: ['mobile', 'desktop', 'tablet'],
      default: 'mobile',
    },
  },
  {
    timestamps: true,
  }
);

adImpressionSchema.index({ campaign: 1, createdAt: -1 });
adImpressionSchema.index({ user: 1, createdAt: -1 });
adImpressionSchema.index({ impressionId: 1 });

module.exports = mongoose.model('AdImpression', adImpressionSchema);
