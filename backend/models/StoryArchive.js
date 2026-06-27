const mongoose = require('mongoose');

const storyArchiveSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  originalStoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story',
  },
  media: {
    type: String,
    required: true,
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    default: 'image',
  },
  caption: {
    type: String,
    default: '',
    maxlength: 500,
  },
  highlight: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Highlight',
    default: null,
  },
  viewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  originalCreatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

storyArchiveSchema.index({ author: 1, createdAt: -1 });
storyArchiveSchema.index({ highlight: 1 });

module.exports = mongoose.model('StoryArchive', storyArchiveSchema);
