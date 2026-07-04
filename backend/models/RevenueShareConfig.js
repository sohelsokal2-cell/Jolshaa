const mongoose = require('mongoose');

const revenueShareConfigSchema = new mongoose.Schema(
  {
    videoAdRevenueShare: {
      creator: { type: Number, default: 55 },
      platform: { type: Number, default: 45 },
    },
    starGiftRevenueShare: {
      creator: { type: Number, default: 70 },
      platform: { type: Number, default: 30 },
    },
    subscriptionRevenueShare: {
      creator: { type: Number, default: 80 },
      platform: { type: Number, default: 20 },
    },
    starPackages: [
      {
        stars: { type: Number, required: true },
        priceBDT: { type: Number, required: true },
      },
    ],
    adRevenuePerView: {
      type: Number,
      default: 0.50,
    },
    minimumPayout: {
      type: Number,
      default: 1000,
    },
    payoutProcessingDays: {
      type: Number,
      default: 5,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('RevenueShareConfig', revenueShareConfigSchema);
