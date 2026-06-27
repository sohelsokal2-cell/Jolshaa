const mongoose = require('mongoose');

const userFeedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  type: {
    type: String,
    enum: ['bug', 'feature_request', 'improvement', 'complaint', 'praise', 'other'],
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  status: {
    type: String,
    enum: ['new', 'reviewing', 'planned', 'in_progress', 'completed', 'declined'],
    default: 'new',
  },
  adminNote: {
    type: String,
    default: '',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  page: { type: String, default: '' },
  screenshot: { type: String, default: '' },
  browserInfo: { type: String, default: '' },
}, { timestamps: true });

userFeedbackSchema.index({ type: 1, status: 1 });
userFeedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model('UserFeedback', userFeedbackSchema);
