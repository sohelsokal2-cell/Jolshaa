const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
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
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: String,
    default: '',
    maxlength: 200
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    default: null
  },
  visibility: {
    type: String,
    enum: ['public', 'friends', 'invite_only'],
    default: 'public'
  },
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['going', 'maybe', 'not_going'],
      default: 'going'
    },
    respondedAt: {
      type: Date,
      default: Date.now
    }
  }],
  invitedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

eventSchema.index({ startDate: 1 });
eventSchema.index({ creator: 1 });
eventSchema.index({ visibility: 1 });
eventSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Event', eventSchema);
