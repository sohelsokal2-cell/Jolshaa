const mongoose = require('mongoose');

const creatorPayoutSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    period: {
      from: { type: Date, required: true },
      to: { type: Date, required: true },
    },
    breakdown: {
      subscriptions: { type: Number, default: 0 },
      tips: { type: Number, default: 0 },
      adRevenue: { type: Number, default: 0 },
      boostRevenue: { type: Number, default: 0 },
      bonus: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'held'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'paypal', 'manual'],
      default: 'bank_transfer',
    },
    paidAt: {
      type: Date,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

creatorPayoutSchema.index({ creator: 1, createdAt: -1 });
creatorPayoutSchema.index({ status: 1 });

module.exports = mongoose.model('CreatorPayout', creatorPayoutSchema);
