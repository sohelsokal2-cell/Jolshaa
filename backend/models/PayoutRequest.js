const mongoose = require('mongoose');

const payoutRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    method: {
      type: String,
      enum: ['bkash', 'nagad', 'rocket', 'bank'],
      required: true,
    },
    accountDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'rejected'],
      default: 'pending',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
    },
    adminNote: {
      type: String,
      default: '',
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

payoutRequestSchema.index({ user: 1, status: 1 });
payoutRequestSchema.index({ status: 1 });

module.exports = mongoose.model('PayoutRequest', payoutRequestSchema);
