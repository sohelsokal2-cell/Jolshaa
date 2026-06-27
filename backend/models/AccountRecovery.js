const mongoose = require('mongoose');

const accountRecoverySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['password_reset', 'email_change', 'account_unlock', 'identity_verification', 'other'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'expired'],
    default: 'pending',
  },
  reason: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  evidence: [{
    type: String,
  }],
  handledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  adminNote: {
    type: String,
    default: '',
  },
  handledAt: {
    type: Date,
    default: null,
  },
  newEmail: {
    type: String,
    default: '',
  },
  token: {
    type: String,
    default: '',
  },
  expiresAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

accountRecoverySchema.index({ status: 1, createdAt: -1 });
accountRecoverySchema.index({ user: 1 });

module.exports = mongoose.model('AccountRecovery', accountRecoverySchema);
