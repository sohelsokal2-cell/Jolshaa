const mongoose = require('mongoose');

const savedFolderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    maxlength: 50,
  },
  icon: {
    type: String,
    default: '📁',
  },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
  }],
}, {
  timestamps: true,
});

savedFolderSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('SavedFolder', savedFolderSchema);
