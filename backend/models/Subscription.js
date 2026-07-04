const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subscriber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionTier',
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'payment_failed'],
      default: 'active',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    nextBillingDate: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    paymentHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
      },
    ],
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.index({ creator: 1, status: 1 });
subscriptionSchema.index({ subscriber: 1, status: 1 });
subscriptionSchema.index({ nextBillingDate: 1 });
subscriptionSchema.index({ creator: 1, subscriber: 1 }, { unique: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
