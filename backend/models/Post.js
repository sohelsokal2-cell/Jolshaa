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
    maxlength: 10000
  },
  media: [{
    url: { type: String },
    type: { type: String, enum: ['image', 'video'], default: 'image' },
    altText: { type: String, default: '' },
    caption: { type: String, default: '' },
    thumbnailUrl: { type: String, default: '' },
  }],
  video: {
    url: { type: String },
    publicId: { type: String },
    thumbnailUrl: { type: String },
    duration: { type: Number },
    width: { type: Number },
    height: { type: Number },
    format: { type: String },
    sizeInBytes: { type: Number },
    processingStatus: {
      type: String,
      enum: ['uploading', 'processing', 'ready', 'failed'],
      default: 'uploading',
    },
    isShortForm: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    uniqueViewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    watchTime: { type: Number, default: 0 },
    qualities: [{
      resolution: String,
      url: String,
    }],
    audioTrack: { type: String, default: '' },
    effectsUsed: [{ type: String }],
  },
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
    enum: ['public', 'friends', 'close_friends', 'custom', 'onlyme'],
    default: 'public'
  },
  customAudiences: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
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
  collaborators: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['editor', 'viewer'], default: 'editor' },
    invitedAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date, default: null },
  }],
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
  isFlagged: {
    type: Boolean,
    default: false
  },
  flagReason: {
    type: String,
    default: ''
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  hiddenFromProfile: {
    type: Boolean,
    default: false
  },
  hiddenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  hiddenAt: {
    type: Date,
    default: null
  },
  moderationStatus: {
    type: String,
    enum: ['none', 'pending_review', 'approved', 'flagged', 'removed'],
    default: 'none'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled', 'archived'],
    default: 'draft'
  },
  scheduledAt: {
    type: Date,
    default: null
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  contentWarning: {
    type: String,
    enum: ['none', 'violence', 'nudity', 'drugs', 'language', 'spoiler', 'sensitive'],
    default: 'none'
  },
  communityLabel: {
    type: String,
    default: ''
  },
  footnotes: {
    type: String,
    default: '',
    maxlength: 2000
  },
  pinnedComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  factCheck: {
    status: {
      type: String,
      enum: ['unverified', 'true', 'false', 'misleading'],
      default: 'unverified'
    },
    trueVotes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    falseVotes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    misleadingVotes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    totalVotes: {
      type: Number,
      default: 0
    },
    verifiedByAdmin: {
      type: Boolean,
      default: false
    },
    adminVerdict: {
      type: String,
      enum: ['true', 'false', 'misleading', null],
      default: null
    },
    adminNote: {
      type: String,
      default: ''
    },
    flaggedForReview: {
      type: Boolean,
      default: false
    }
  },
}, {
  timestamps: true
});

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ visibility: 1, createdAt: -1 });
postSchema.index({ 'postedIn.type': 1, 'postedIn.refId': 1, createdAt: -1 });
postSchema.index({ text: 'text' });
postSchema.index({ hashtags: 1 });
postSchema.index({ 'video.isShortForm': 1, createdAt: -1 });
postSchema.index({ 'video.processingStatus': 1 });
postSchema.index({ 'video.views': -1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
