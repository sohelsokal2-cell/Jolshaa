const mongoose = require('mongoose');

const undoSnapshotSchema = new mongoose.Schema(
  {
    actionLog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminAction',
      required: true,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetType: {
      type: String,
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    undone: {
      type: Boolean,
      default: false,
    },
    undoneAt: {
      type: Date,
    },
    undoneBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

undoSnapshotSchema.index({ admin: 1, createdAt: -1 });
undoSnapshotSchema.index({ targetType: 1, targetId: 1 });
undoSnapshotSchema.index({ undone: 1 });

module.exports = mongoose.model('UndoSnapshot', undoSnapshotSchema);
