const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    default: '',
    maxlength: 2000
  },
  media: {
    type: String,
    default: null
  },
  mediaType: {
    type: String,
    enum: ['image', 'video', 'audio', 'file', 'voice', null],
    default: null
  },
  fileName: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    default: null
  },
  voiceDuration: {
    type: Number,
    default: null
  },
  mediaMetadata: {
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    duration: { type: Number, default: null },
    thumbnail: { type: String, default: null }
  },
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String, required: true },
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  forwardedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    text: { type: String },
    editedAt: { type: Date, default: Date.now }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedForEveryone: {
    type: Boolean,
    default: false
  },
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  pinnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  pinnedAt: {
    type: Date,
    default: null
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  linkPreview: {
    url: { type: String, default: null },
    title: { type: String, default: null },
    description: { type: String, default: null },
    image: { type: String, default: null }
  },
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ conversation: 1, isPinned: 1 });
messageSchema.index({ text: 'text' });
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Message', messageSchema);
