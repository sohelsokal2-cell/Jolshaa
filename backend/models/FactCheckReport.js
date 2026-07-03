const mongoose = require('mongoose');

const factCheckReportSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    maxlength: 1000
  }
}, {
  timestamps: true
});

factCheckReportSchema.index({ post: 1, createdAt: -1 });
factCheckReportSchema.index({ reporter: 1 });

module.exports = mongoose.model('FactCheckReport', factCheckReportSchema);
