const mongoose = require('mongoose');

const mediaRestrictionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['file_type', 'file_size', 'resolution', 'duration'],
      required: true,
    },
    config: {
      allowedTypes: [{ type: String }],
      maxSizeMB: { type: Number },
      minResolution: { type: String },
      maxResolution: { type: String },
      maxDurationSec: { type: Number },
    },
    appliesTo: {
      type: String,
      enum: ['posts', 'stories', 'comments', 'messages', 'all'],
      default: 'all',
    },
    action: {
      type: String,
      enum: ['block', 'flag', 'resize'],
      default: 'block',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MediaRestriction', mediaRestrictionSchema);
