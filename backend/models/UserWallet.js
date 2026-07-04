const mongoose = require('mongoose');

const userWalletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    starsBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    transactionHistory: [
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

userWalletSchema.index({ user: 1 });

module.exports = mongoose.model('UserWallet', userWalletSchema);
