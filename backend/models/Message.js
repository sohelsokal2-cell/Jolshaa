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
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String, required: true },
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ text: 'text' });

module.exports = mongoose.model('Message', messageSchema);
