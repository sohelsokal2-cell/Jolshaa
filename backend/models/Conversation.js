const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  isGroup: {
    type: Boolean,
    default: false
  },
  groupName: {
    type: String,
    default: null,
    maxlength: 50
  },
  groupPhoto: {
    type: String,
    default: null
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  archivedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  pinnedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  mutedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  watchParty: {
    active: { type: Boolean, default: false },
    videoUrl: { type: String, default: '' },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  conversationType: {
    type: String,
    enum: ['direct', 'group', 'help_coordination'],
    default: 'direct'
  },
  helpRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HelpRequest',
    default: null
  },
}, {
  timestamps: true
});

conversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
