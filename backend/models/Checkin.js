const mongoose = require('mongoose');

const checkinSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
    },
    location: {
      name: { type: String, required: true },
      address: { type: String, default: '' },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      category: { type: String, default: '' },
    },
    message: {
      type: String,
      default: '',
      maxlength: 500,
    },
    taggedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  { timestamps: true }
);

checkinSchema.index({ user: 1, createdAt: -1 });
checkinSchema.index({ 'location.name': 1 });

module.exports = mongoose.model('Checkin', checkinSchema);
