const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    category: {
      type: String,
      enum: ['site', 'feature', 'maintenance', 'announcement', 'email', 'security', 'upload', 'monetization'],
      default: 'site',
    },
    description: {
      type: String,
      default: '',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

systemSettingSchema.index({ key: 1 }, { unique: true });
systemSettingSchema.index({ category: 1 });

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
