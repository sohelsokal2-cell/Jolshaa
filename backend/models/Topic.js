const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: 50,
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    default: '',
    maxlength: 500,
  },
  icon: {
    type: String,
    default: '',
  },
  coverImage: {
    type: String,
    default: '',
  },
  keywords: [{
    type: String,
    trim: true,
  }],
  postCount: {
    type: Number,
    default: 0,
  },
  followerCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isTrending: {
    type: Boolean,
    default: false,
  },
  trendingScore: {
    type: Number,
    default: 0,
  },
  order: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, { timestamps: true });

topicSchema.index({ name: 1 });
topicSchema.index({ postCount: -1 });
topicSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('Topic', topicSchema);
