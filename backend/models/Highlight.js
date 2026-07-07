const mongoose = require('mongoose');

const highlightSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    maxlength: 50,
  },
  coverImage: {
    type: String,
    default: '',
  },
  stories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StoryArchive',
  }],
  isFlagged: {
    type: Boolean,
    default: false,
  },
  flagReason: {
    type: String,
    default: '',
  },
  isHidden: {
    type: Boolean,
    default: false,
  },
  hiddenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  hiddenAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

highlightSchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model('Highlight', highlightSchema);
