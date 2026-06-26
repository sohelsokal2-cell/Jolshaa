const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    default: '',
    maxlength: 2000
  },
  coverPhoto: {
    type: String,
    default: null
  },
  privacy: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  pendingRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  rules: [{
    type: String,
    maxlength: 200
  }],
  pinnedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  }
}, {
  timestamps: true
});

groupSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Group', groupSchema);
