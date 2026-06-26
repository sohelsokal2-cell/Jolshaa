const mongoose = require('mongoose');

const draftSchema = new mongoose.Schema(
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
    hashtags: [{ type: String }],
  },
  { timestamps: true }
);

draftSchema.index({ author: 1, updatedAt: -1 });

module.exports = mongoose.model('Draft', draftSchema);
