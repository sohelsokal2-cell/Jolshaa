const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: [true, 'Post text is required'],
    maxlength: 5000
  },
  media: [{
    type: String
  }],
  feeling: {
    type: String,
    default: null,
    maxlength: 100
  },
  taggedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  visibility: {
    type: String,
    enum: ['public', 'friends', 'onlyme'],
    default: 'public'
  },
  postedIn: {
    type: {
      type: String,
      enum: ['profile', 'group', 'page'],
      default: 'profile'
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    }
  },
  isEdited: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ visibility: 1, createdAt: -1 });
postSchema.index({ 'postedIn.type': 1, 'postedIn.refId': 1, createdAt: -1 });
postSchema.index({ text: 'text' });

module.exports = mongoose.model('Post', postSchema);
