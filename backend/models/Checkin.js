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
      category: { type: String, default: '' },
      division: { type: String, default: '' },
      district: { type: String, default: '' },
      upazila: { type: String, default: '' },
      coordinates: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
      },
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
