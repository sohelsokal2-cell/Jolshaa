const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    video: {
      type: String,
      required: [true, 'Video URL is required'],
    },
    thumbnail: {
      type: String,
      default: '',
    },
    caption: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    music: {
      type: String,
      default: '',
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, required: true, maxlength: 1000 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    views: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    shares: {
      type: Number,
      default: 0,
    },
    hashtags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
      default: '',
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

reelSchema.index({ author: 1, createdAt: -1 });
reelSchema.index({ hashtags: 1 });
reelSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Reel', reelSchema);
