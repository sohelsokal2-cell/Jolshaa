const mongoose = require('mongoose');

const adminActionSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    action: {
      type: String,
      required: true,
      enum: [
        'user.suspend', 'user.unsuspend', 'user.ban', 'user.unban',
        'user.warn', 'user.delete', 'user.verify', 'user.unverify',
        'user.role_change', 'user.restrict', 'user.restriction_remove',
        'content.remove_post', 'content.remove_comment', 'content.remove_story',
        'content.remove_reel', 'content.remove_listing',
        'content.flag_post', 'content.flag_comment', 'content.flag_story',
        'content.flag_reel', 'content.flag_listing',
        'content.hide_post', 'content.hide_comment', 'content.hide_story',
        'content.hide_reel', 'content.hide_listing',
        'content.approve_post', 'content.approve_comment', 'content.approve_story',
        'content.approve_reel', 'content.approve_listing',
        'content.bulk_remove', 'content.bulk_flag', 'content.bulk_hide',
        'content.shadow_hide',
        'report.resolve', 'report.dismiss', 'report.escalate', 'report.assign',
        'appeal.accept', 'appeal.reject',
        'page.verify', 'page.unverify',
        'safety.note_add', 'safety.spam_flag', 'safety.score_update',
        'safety.offender_flag', 'safety.offender_clear',
      ]
    },
    targetType: {
      type: String,
      enum: ['User', 'Post', 'Comment', 'Story', 'Reel', 'Listing', 'Page', 'Report', 'Appeal'],
      required: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    targetName: {
      type: String,
      default: ''
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

adminActionSchema.index({ admin: 1, createdAt: -1 });
adminActionSchema.index({ action: 1, createdAt: -1 });
adminActionSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model('AdminAction', adminActionSchema);
