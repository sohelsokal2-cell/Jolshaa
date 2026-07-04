const mongoose = require('mongoose');

const adNetworkSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: ['monetag', 'propellerads', 'admaven', 'adsterra', 'googleadsense'],
    },
    displayName: {
      type: String,
      required: true,
    },
    enabled: {
      type: Boolean,
      default: false,
    },
    // Publisher/API credentials
    publisherId: {
      type: String,
      default: '',
    },
    apiKey: {
      type: String,
      default: '',
    },
    // Ad tags/scripts for different formats
    adFormats: {
      popunder: {
        enabled: { type: Boolean, default: false },
        script: { type: String, default: '' },
        tagId: { type: String, default: '' },
      },
      socialBar: {
        enabled: { type: Boolean, default: false },
        script: { type: String, default: '' },
        tagId: { type: String, default: '' },
      },
      nativeBanner: {
        enabled: { type: Boolean, default: false },
        script: { type: String, default: '' },
        tagId: { type: String, default: '' },
      },
      video: {
        enabled: { type: Boolean, default: false },
        script: { type: String, default: '' },
        tagId: { type: String, default: '' },
      },
      interstitial: {
        enabled: { type: Boolean, default: false },
        script: { type: String, default: '' },
        tagId: { type: String, default: '' },
      },
      banner: {
        enabled: { type: Boolean, default: false },
        script: { type: String, default: '' },
        tagId: { type: String, default: '' },
        size: { type: String, default: '728x90' },
      },
      directLink: {
        enabled: { type: Boolean, default: false },
        script: { type: String, default: '' },
        tagId: { type: String, default: '' },
      },
    },
    // Revenue settings
    revenueModel: {
      type: String,
      enum: ['cpm', 'cpc', 'cpa', 'revshare'],
      default: 'cpm',
    },
    // Global ad settings
    adFrequency: {
      type: Number,
      default: 3,
    },
    videoAdFrequency: {
      type: Number,
      default: 1,
    },
    // Page restrictions
    allowedPages: [{ type: String }],
    blockedPages: [{ type: String }],
    // Priority (higher = shown first)
    priority: {
      type: Number,
      default: 0,
    },
    // Stats tracking
    totalImpressions: { type: Number, default: 0 },
    totalClicks: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    // Status
    status: {
      type: String,
      enum: ['active', 'paused', 'pending', 'rejected'],
      default: 'pending',
    },
    lastSyncAt: { type: Date },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick lookup
adNetworkSchema.index({ name: 1, enabled: 1 });

module.exports = mongoose.model('AdNetwork', adNetworkSchema);
