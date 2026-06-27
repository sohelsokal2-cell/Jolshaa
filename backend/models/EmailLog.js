const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['email', 'sms', 'push'],
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  subject: {
    type: String,
    default: '',
  },
  template: {
    type: String,
    default: 'default',
  },
  status: {
    type: String,
    enum: ['queued', 'sent', 'delivered', 'failed', 'bounced', 'skipped'],
    default: 'queued',
  },
  error: {
    type: String,
    default: '',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  sentAt: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },
  failedAt: { type: Date, default: null },
}, { timestamps: true });

emailLogSchema.index({ type: 1, status: 1 });
emailLogSchema.index({ toUser: 1 });
emailLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);
