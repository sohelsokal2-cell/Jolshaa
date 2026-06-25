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
  },
  {
    timestamps: true,
  }
);

albumSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('Album', albumSchema);
