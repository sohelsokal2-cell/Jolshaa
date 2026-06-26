const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    images: [
      {
        type: String,
      },
    ],
    category: {
      type: String,
      enum: ['electronics', 'clothing', 'home', 'vehicles', 'services', 'other'],
      default: 'other',
    },
    condition: {
      type: String,
      enum: ['new', 'like_new', 'good', 'fair', 'poor'],
      default: 'good',
    },
    location: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'sold', 'reserved', 'removed'],
      default: 'active',
    },
    interested: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

listingSchema.index({ seller: 1, createdAt: -1 });
listingSchema.index({ category: 1, status: 1 });
listingSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Listing', listingSchema);
