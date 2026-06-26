const mongoose = require('mongoose');

const storySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    media: {
      type: String,
      required: [true, 'Story media is required'],
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },
    viewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    visibility: {
      type: String,
      enum: ['public', 'friends', 'custom'],
      default: 'friends'
    },
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        emoji: { type: String, required: true },
      },
    ],
    replies: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, required: true, maxlength: 500 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    isFlagged: {
      type: Boolean,
      default: false,
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

// TTL index: auto-delete documents 24 hours after createdAt
storySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
storySchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model('Story', storySchema);
