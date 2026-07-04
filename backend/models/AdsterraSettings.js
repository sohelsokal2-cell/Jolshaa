const mongoose = require('mongoose');

const adsterraSettingsSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },
    publisherId: {
      type: String,
      default: '',
    },
    // Ad tags for different formats
    popunder: {
      enabled: { type: Boolean, default: false },
      script: { type: String, default: '' }, // Full script tag from Adsterra
    },
    socialBar: {
      enabled: { type: Boolean, default: false },
      script: { type: String, default: '' },
    },
    nativeBanner: {
      enabled: { type: Boolean, default: false },
      script: { type: String, default: '' },
    },
    video: {
      enabled: { type: Boolean, default: false },
      script: { type: String, default: '' },
    },
    // Global settings
    adFrequency: {
      type: Number,
      default: 3, // Show ads every N posts
    },
    videoAdFrequency: {
      type: Number,
      default: 1, // Show video ads every N videos
    },
    // Whitelist/Blacklist
    allowedPages: [{ type: String }], // Pages where ads are shown
    blockedPages: [{ type: String }], // Pages where ads are hidden
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AdsterraSettings', adsterraSettingsSchema);
