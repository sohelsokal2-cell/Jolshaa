const mongoose = require('mongoose');

const moderatorNoteSchema = new mongoose.Schema(
  {
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      default: null
    },
    targetType: {
      type: String,
      enum: ['report', 'user', 'post', 'comment', 'story', 'reel', 'listing'],
      required: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    note: {
      type: String,
      required: [true, 'Note text is required'],
      maxlength: 2000
    },
    isInternal: {
      type: Boolean,
      default: true
    },
    tags: [{
      type: String,
      enum: ['escalation', 'investigation', 'resolved', 'follow_up', 'urgent', 'pattern', 'other']
    }]
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

moderatorNoteSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
moderatorNoteSchema.index({ report: 1 });
moderatorNoteSchema.index({ author: 1 });

module.exports = mongoose.model('ModeratorNote', moderatorNoteSchema);
