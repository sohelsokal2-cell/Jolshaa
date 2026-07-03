const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  caller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  callType: {
    type: String,
    enum: ['audio', 'video'],
    required: true
  },
  status: {
    type: String,
    enum: ['completed', 'missed', 'rejected', 'cancelled', 'no_answer'],
    default: 'completed'
  },
  duration: {
    type: Number,
    default: 0
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

callLogSchema.index({ conversation: 1, createdAt: -1 });
callLogSchema.index({ caller: 1, createdAt: -1 });
callLogSchema.index({ receiver: 1, createdAt: -1 });

module.exports = mongoose.model('CallLog', callLogSchema);
