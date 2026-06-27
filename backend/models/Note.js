const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    maxlength: 200,
  },
  content: {
    type: String,
    required: true,
    maxlength: 50000,
  },
  coverImage: {
    type: String,
    default: '',
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true,
  }],
  visibility: {
    type: String,
    enum: ['public', 'friends', 'onlyme'],
    default: 'public',
  },
  readTime: {
    type: Number,
    default: 0,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  isPublished: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

noteSchema.index({ author: 1, createdAt: -1 });
noteSchema.index({ title: 'text', content: 'text' });
noteSchema.index({ tags: 1 });

module.exports = mongoose.model('Note', noteSchema);
