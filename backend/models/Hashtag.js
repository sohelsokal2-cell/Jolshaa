const mongoose = require('mongoose');

const hashtagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    postCount: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

hashtagSchema.index({ name: 1 });
hashtagSchema.index({ postCount: -1 });

module.exports = mongoose.model('Hashtag', hashtagSchema);
