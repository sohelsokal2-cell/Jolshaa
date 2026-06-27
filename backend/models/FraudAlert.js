const mongoose = require('mongoose');

const fraudAlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['suspicious_payment', 'multiple_refunds', 'fake_engagement', 'ad_fraud', 'tip_manipulation', 'account_takeover'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    description: {
      type: String,
      required: true,
    },
    evidence: [{
      field: String,
      value: String,
    }],
    status: {
      type: String,
      enum: ['open', 'investigating', 'resolved', 'dismissed'],
      default: 'open',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolution: {
      type: String,
      default: '',
    },
    relatedTransactions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    }],
  },
  {
    timestamps: true,
  }
);

fraudAlertSchema.index({ user: 1, createdAt: -1 });
fraudAlertSchema.index({ status: 1, severity: 1 });

module.exports = mongoose.model('FraudAlert', fraudAlertSchema);
