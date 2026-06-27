const mongoose = require('mongoose');

const notificationPreferenceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  preferences: {
    friend_request: { type: Boolean, default: true },
    friend_accept: { type: Boolean, default: true },
    comment: { type: Boolean, default: true },
    reaction: { type: Boolean, default: true },
    tag: { type: Boolean, default: true },
    message: { type: Boolean, default: true },
    group_invite: { type: Boolean, default: true },
    share: { type: Boolean, default: true },
    event_invite: { type: Boolean, default: true },
    event_rsvp: { type: Boolean, default: true },
    tip: { type: Boolean, default: true },
    subscription: { type: Boolean, default: true },
    system: { type: Boolean, default: true }
  },
  quietHours: {
    enabled: { type: Boolean, default: false },
    start: { type: String, default: '22:00' },
    end: { type: String, default: '08:00' }
  },
  emailNotifications: { type: Boolean, default: false }
}, {
  timestamps: true
});

module.exports = mongoose.model('NotificationPreference', notificationPreferenceSchema);
