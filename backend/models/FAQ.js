const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  answer: {
    type: String,
    required: true,
    maxlength: 10000,
  },
  category: {
    type: String,
    enum: ['account', 'features', 'privacy', 'safety', 'billing', 'technical', 'general'],
    default: 'general',
  },
  order: {
    type: Number,
    default: 0,
  },
  isVisible: {
    type: Boolean,
    default: true,
  },
  helpful: {
    type: Number,
    default: 0,
  },
  notHelpful: {
    type: Number,
    default: 0,
  },
  tags: [{ type: String }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, { timestamps: true });

faqSchema.index({ category: 1, order: 1 });
faqSchema.index({ isVisible: 1 });

module.exports = mongoose.model('FAQ', faqSchema);
