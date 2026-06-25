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
  },
  {
    timestamps: true,
  }
);

// TTL index: auto-delete documents 24 hours after createdAt
storySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
storySchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model('Story', storySchema);
