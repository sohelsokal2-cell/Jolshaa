const mongoose = require('mongoose');

const scheduledPostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      default: '',
      maxlength: 5000,
    },
    media: [{ type: String }],
    visibility: {
      type: String,
      enum: ['public', 'friends', 'onlyme'],
      default: 'public',
    },
    postedIn: {
      type: { type: String, enum: ['profile', 'group', 'page'], default: 'profile' },
      refId: { type: mongoose.Schema.Types.ObjectId, default: null },
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'posted', 'cancelled'],
      default: 'pending',
    },
    hashtags: [{ type: String }],
  },
  { timestamps: true }
);

scheduledPostSchema.index({ author: 1, scheduledAt: 1 });

module.exports = mongoose.model('ScheduledPost', scheduledPostSchema);
