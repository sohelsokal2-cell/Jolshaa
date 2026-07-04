const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  phone: {
    type: String,
    default: null,
    match: [/^[\d+\-\s()]{7,15}$/, 'Please enter a valid phone number']
  },
  profilePhoto: {
    type: String,
    default: 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'
  },
  coverPhoto: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    default: '',
    maxlength: 200
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer not to say'],
    default: 'prefer not to say'
  },
  education: {
    type: String,
    default: '',
    maxlength: 200
  },
  work: {
    type: String,
    default: '',
    maxlength: 200
  },
  location: {
    type: String,
    default: '',
    maxlength: 200
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin', 'superadmin'],
    default: 'user'
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  suspendedAt: {
    type: Date,
    default: null
  },
  suspendedReason: {
    type: String,
    default: ''
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  bannedAt: {
    type: Date,
    default: null
  },
  bannedReason: {
    type: String,
    default: ''
  },
  warnings: [{
    message: { type: String, required: true },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    issuedAt: { type: Date, default: Date.now },
    acknowledged: { type: Boolean, default: false }
  }],
  restrictions: [{
    type: { type: String, enum: ['post', 'comment', 'message', 'friend_request', 'group_join'] },
    expiresAt: { type: Date, default: null },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    issuedAt: { type: Date, default: Date.now }
  }],
  verificationRequested: {
    type: Boolean,
    default: false
  },
  verificationReason: {
    type: String,
    default: ''
  },
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  privacy: {
    postVisibility: {
      type: String,
      enum: ['public', 'friends', 'onlyme'],
      default: 'public'
    },
    friendRequests: {
      type: String,
      enum: ['everyone', 'friends_of_friends'],
      default: 'everyone'
    },
    showFriendsList: {
      type: String,
      enum: ['everyone', 'friends', 'onlyme'],
      default: 'everyone'
    },
    commentPrivacy: {
      type: String,
      enum: ['everyone', 'friends', 'none'],
      default: 'everyone'
    },
    storyVisibility: {
      type: String,
      enum: ['public', 'friends', 'custom'],
      default: 'friends'
    },
    messagePrivacy: {
      type: String,
      enum: ['everyone', 'friends', 'none'],
      default: 'everyone'
    }
  },
  storyHiddenFrom: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  closeFriends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  mutedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  restrictedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  trustedDevices: [{
    fingerprint: { type: String, required: true },
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },
    label: { type: String, default: '' },
    lastUsedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
  }],
  savedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  creatorSettings: {
    tipsEnabled: { type: Boolean, default: false },
    subscriptionPrice: { type: Number, default: 0 },
    subscriptionInterval: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    featuredContent: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]
  },
  creatorCategory: {
    type: String,
    default: ''
  },
  subscriptionPrice: {
    type: Number,
    default: 0
  },
  subscribers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  tipsEnabled: {
    type: Boolean,
    default: false
  },
  marketplaceEnabled: {
    type: Boolean,
    default: false
  },
  safetyScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  reportsReceived: {
    type: Number,
    default: 0
  },
  reportsResolved: {
    type: Number,
    default: 0
  },
  isRepeatOffender: {
    type: Boolean,
    default: false
  },
  lastReportedAt: {
    type: Date,
    default: null
  },
  passwordResetToken: {
    type: String,
    default: null,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    default: null,
    select: false
  },
  safety: {
    isMinor: { type: Boolean, default: false },
    parentalControlEnabled: { type: Boolean, default: false },
    parentalEmail: { type: String, default: '' },
    loginAlerts: { type: Boolean, default: true },
    twoFactorEnabled: { type: Boolean, default: false },
    contentFilterLevel: { type: String, enum: ['off', 'moderate', 'strict'], default: 'moderate' },
    restrictedDMs: { type: Boolean, default: false },
  },
  sessions: [{
    token: { type: String, required: true },
    ip: { type: String },
    userAgent: { type: String },
    location: { type: String, default: '' },
    device: { type: String, default: '' },
    lastActive: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
  }],
  loginHistory: [{
    ip: { type: String },
    userAgent: { type: String },
    location: { type: String, default: '' },
    success: { type: Boolean, default: true },
    timestamp: { type: Date, default: Date.now }
  }],
  activeStatus: {
    type: String,
    enum: ['online', 'away', 'busy', 'offline'],
    default: 'offline'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  helpedCount: {
    type: Number,
    default: 0
  },
  helpedOthersCount: {
    type: Number,
    default: 0
  },
  monetization: {
    isEligible: { type: Boolean, default: false },
    isCreator: { type: Boolean, default: false },
    followerCount: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    totalPaidOut: { type: Number, default: 0 },
    availableBalance: { type: Number, default: 0 },
    pendingBalance: { type: Number, default: 0 },
    payoutMethod: {
      type: { type: String, enum: ['bkash', 'nagad', 'rocket', 'bank'], default: null },
      accountNumber: { type: String },
      accountName: { type: String },
      bankName: { type: String },
      branchName: { type: String },
      routingNumber: { type: String }
    },
    taxInfo: {
      nidNumber: { type: String },
      tinNumber: { type: String }
    },
    verificationStatus: {
      type: String,
      enum: ['not_applied', 'pending', 'approved', 'rejected'],
      default: 'not_applied'
    },
    appliedAt: { type: Date },
    approvedAt: { type: Date },
    rejectionReason: { type: String }
  },
  badges: {
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

userSchema.index({ name: 'text', bio: 'text' });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
