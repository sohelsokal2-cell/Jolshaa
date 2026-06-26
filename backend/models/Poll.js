const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    question: {
      type: String,
      required: true,
      maxlength: 300,
    },
    options: [
      {
        text: { type: String, required: true, maxlength: 150 },
        voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      },
    ],
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

pollSchema.index({ post: 1 });

module.exports = mongoose.model('Poll', pollSchema);
