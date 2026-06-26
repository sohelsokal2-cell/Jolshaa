const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['friend_request', 'friend_accept', 'comment', 'reaction', 'tag', 'message', 'group_invite', 'share', 'event_invite', 'event_rsvp', 'tip', 'subscription'],
    required: true
  },
  relatedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },
  relatedComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  relatedConversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    default: null
  },
  relatedEvent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
