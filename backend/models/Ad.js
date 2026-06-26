const mongoose = require('mongoose');

const adSchema = new mongoose.Schema(
  {
    advertiser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    description: {
      type: String,
      default: '',
      maxlength: 500,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    linkUrl: {
      type: String,
      default: '',
    },
    budget: {
      type: Number,
      required: true,
    },
    spent: {
      type: Number,
      default: 0,
    },
    impressions: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'rejected'],
      default: 'active',
    },
    targetAudience: {
      ageMin: { type: Number, default: 13 },
      ageMax: { type: Number, default: 65 },
      locations: [{ type: String }],
    },
    startsAt: {
      type: Date,
      default: Date.now,
    },
    endsAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

adSchema.index({ status: 1, endsAt: 1 });

const Ad = mongoose.model('Ad', adSchema);
module.exports = Ad;
