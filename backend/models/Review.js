const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    page: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Page',
      required: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Rating is required'],
    },
    reviewText: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    recommends: {
      type: Boolean,
      default: true,
    },
    editedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ page: 1, createdAt: -1 });
reviewSchema.index({ page: 1, reviewer: 1 }, { unique: true });
reviewSchema.index({ reviewer: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
