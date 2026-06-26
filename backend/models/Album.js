const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Album title is required'],
      trim: true,
      maxlength: 100,
    },
    photos: [
      {
        type: String,
      },
    ],
    description: {
      type: String,
      default: '',
      maxlength: 500,
    },
    visibility: {
      type: String,
      enum: ['public', 'friends', 'onlyme'],
      default: 'friends',
    },
    sharedWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isHighlight: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

albumSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('Album', albumSchema);
