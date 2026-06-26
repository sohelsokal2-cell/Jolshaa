const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    default: '',
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
  },
  sharedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isAnnouncement: {
    type: Boolean,
    default: false
  },
  hashtags: [{
    type: String,
    lowercase: true,
    trim: true,
  }],
  analytics: {
    reach: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
  },
  isBoosted: {
    type: Boolean,
    default: false
  },
  boostEndsAt: {
    type: Date,
    default: null
  },
  isSponsored: {
    type: Boolean,
    default: false
  },
  sponsorName: {
    type: String,
    default: ''
  },
  sponsorUrl: {
    type: String,
    default: ''
  },
}, {
  timestamps: true
});

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ visibility: 1, createdAt: -1 });
postSchema.index({ 'postedIn.type': 1, 'postedIn.refId': 1, createdAt: -1 });
postSchema.index({ text: 'text' });
postSchema.index({ hashtags: 1 });

module.exports = mongoose.model('Post', postSchema);
