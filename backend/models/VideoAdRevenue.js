const mongoose = require('mongoose');

const videoAdRevenueSchema = new mongoose.Schema(
  {
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    monetizedViews: {
      type: Number,
      default: 0,
    },
    estimatedRevenue: {
      type: Number,
      default: 0,
    },
    creatorShare: {
      type: Number,
      default: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

videoAdRevenueSchema.index({ video: 1 });
videoAdRevenueSchema.index({ creator: 1, date: -1 });
videoAdRevenueSchema.index({ creator: 1 });

module.exports = mongoose.model('VideoAdRevenue', videoAdRevenueSchema);
