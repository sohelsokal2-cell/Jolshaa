const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'star_purchase',
        'star_gift_sent',
        'star_gift_received',
        'subscription_payment',
        'subscription_earning',
        'ad_revenue',
        'ad_campaign_payment',
        'boost_payment',
        'creator_bonus',
        'payout_request',
        'payout_completed',
        'refund',
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    starsAmount: {
      type: Number,
      default: 0,
    },
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    relatedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
    paymentGateway: {
      type: String,
      enum: ['sslcommerz', 'bkash', 'nagad', 'rocket', 'internal'],
      default: 'internal',
    },
    gatewayTransactionId: {
      type: String,
      sparse: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    description: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ gatewayTransactionId: 1 });
transactionSchema.index({ relatedUser: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
