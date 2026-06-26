const mongoose = require('mongoose');

const appealSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['ban', 'suspend', 'warning', 'restriction', 'verification'],
      required: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      maxlength: 1000
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'accepted', 'rejected'],
      default: 'pending'
    },
    adminNote: {
      type: String,
      default: ''
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

appealSchema.index({ status: 1, createdAt: -1 });
appealSchema.index({ user: 1 });

module.exports = mongoose.model('Appeal', appealSchema);
