const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    targetType: {
      type: String,
      enum: ['post', 'comment', 'user', 'story', 'message'],
      required: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'targetType'
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      enum: [
        'spam',
        'harassment',
        'hate_speech',
        'violence',
        'nudity',
        'misinformation',
        'copyright',
        'other'
      ]
    },
    description: {
      type: String,
      default: '',
      maxlength: 500
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ targetType: 1, targetId: 1 });
reportSchema.index({ reporter: 1 });

module.exports = mongoose.model('Report', reportSchema);
