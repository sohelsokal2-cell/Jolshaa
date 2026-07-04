const mongoose = require('mongoose');

const adCampaignSchema = new mongoose.Schema(
  {
    advertiser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    budget: {
      type: Number,
      required: [true, 'Budget is required'],
      min: 0,
    },
    dailyBudget: {
      type: Number,
      required: [true, 'Daily budget is required'],
      min: 0,
    },
    spentAmount: {
      type: Number,
      default: 0,
    },
    duration: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
    targetAudience: {
      ageMin: { type: Number, default: 13 },
      ageMax: { type: Number, default: 65 },
      gender: {
        type: String,
        enum: ['all', 'male', 'female'],
        default: 'all',
      },
      location: {
        division: { type: String, default: '' },
        district: { type: String, default: '' },
      },
      interests: [
        {
          type: String,
          trim: true,
        },
      ],
    },
    status: {
      type: String,
      enum: ['draft', 'pending_review', 'active', 'paused', 'completed', 'rejected'],
      default: 'draft',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    metrics: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      reach: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 },
    },
    paymentTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },
  },
  {
    timestamps: true,
  }
);

adCampaignSchema.index({ advertiser: 1, status: 1 });
adCampaignSchema.index({ status: 1, 'duration.startDate': 1, 'duration.endDate': 1 });
adCampaignSchema.index({ post: 1 });

module.exports = mongoose.model('AdCampaign', adCampaignSchema);
