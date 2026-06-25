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
    default: 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'
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
  isAdmin: {
    type: Boolean,
    default: false
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  suspendedAt: {
    type: Date,
    default: null
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
    }
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
