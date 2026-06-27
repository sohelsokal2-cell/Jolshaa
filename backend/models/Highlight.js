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
}, {
  timestamps: true,
});

highlightSchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model('Highlight', highlightSchema);
