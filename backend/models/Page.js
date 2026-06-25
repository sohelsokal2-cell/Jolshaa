const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Page name is required'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    default: '',
    maxlength: 2000
  },
  profilePhoto: {
    type: String,
    default: null
  },
  coverPhoto: {
    type: String,
    default: null
  },
  category: {
    type: String,
    required: [true, 'Category is required']
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
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

pageSchema.index({ name: 'text', description: 'text' });
pageSchema.index({ category: 1 });

module.exports = mongoose.model('Page', pageSchema);
