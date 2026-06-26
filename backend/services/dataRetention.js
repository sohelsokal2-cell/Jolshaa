const Post = require('../models/Post');
const Story = require('../models/Story');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const { AuditService } = require('./auditLog');

const RETENTION_POLICIES = {
  stories: 86400000,
  notifications: 30 * 86400000,
  messages: 365 * 86400000,
  inactiveAccounts: 365 * 86400000,
  auditLogs: 90 * 86400000,
  deletedPosts: 30 * 86400000,
};

class DataRetention {
  static async enforceStoryRetention() {
    const cutoff = new Date(Date.now() - RETENTION_POLICIES.stories);
    const result = await Story.deleteMany({ createdAt: { $lt: cutoff } });
    return { type: 'stories', deleted: result.deletedCount };
  }

  static async enforceNotificationRetention() {
    const cutoff = new Date(Date.now() - RETENTION_POLICIES.notifications);
    const result = await Notification.deleteMany({ createdAt: { $lt: cutoff } });
    return { type: 'notifications', deleted: result.deletedCount };
  }

  static async enforceMessageRetention() {
    const cutoff = new Date(Date.now() - RETENTION_POLICIES.messages);
    const result = await Message.deleteMany({ createdAt: { $lt: cutoff } });
    return { type: 'messages', deleted: result.deletedCount };
  }

  static async enforceInactiveAccountRetention() {
    const cutoff = new Date(Date.now() - RETENTION_POLICIES.inactiveAccounts);
    const User = require('../models/User');
    const result = await User.deleteMany({
      lastActive: { $lt: cutoff },
      isAdmin: false,
    });
    return { type: 'inactive_accounts', deleted: result.deletedCount };
  }

  static async cleanSoftDeletedPosts() {
    const cutoff = new Date(Date.now() - RETENTION_POLICIES.deletedPosts);
    const result = await Post.deleteMany({
      isDeleted: true,
      deletedAt: { $lt: cutoff },
    });
    return { type: 'deleted_posts', deleted: result.deletedCount };
  }

  static async runAllPolicies() {
    const results = [];

    results.push(await this.enforceStoryRetention());
    results.push(await this.enforceNotificationRetention());
    results.push(await this.enforceMessageRetention());
    results.push(await this.cleanSoftDeletedPosts());

    await AuditService.log({
      action: 'system.retention',
      targetType: 'System',
      details: { results },
    });

    return results;
  }

  static get Policies() {
    return { ...RETENTION_POLICIES };
  }
}

module.exports = DataRetention;
