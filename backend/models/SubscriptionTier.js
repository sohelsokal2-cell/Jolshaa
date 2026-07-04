const mongoose = require('mongoose');

const subscriptionTierSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Tier name is required'],
      trim: true,
      maxlength: 50,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    perks: [
      {
        type: String,
        trim: true,
      },
    ],
    badge: {
      type: String,
      default: '',
    },
    subscriberCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

subscriptionTierSchema.index({ creator: 1 });
subscriptionTierSchema.index({ creator: 1, isActive: 1 });

module.exports = mongoose.model('SubscriptionTier', subscriptionTierSchema);
