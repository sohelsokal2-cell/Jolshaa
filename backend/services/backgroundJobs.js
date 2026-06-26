const { notificationQueue, mediaQueue, analyticsQueue, cleanupQueue } = require('./queue');
const Notification = require('../models/Notification');
const Post = require('../models/Post');
const Story = require('../models/Story');
const User = require('../models/User');
const { getIO } = require('../socket');
const DataRetention = require('./dataRetention');
const BackupService = require('./backup');
const { processScheduledPosts } = require('../controllers/schedulerController');
const { autoEscalateReports } = require('../controllers/safetyController');

notificationQueue.process(async (data) => {
  try {
    const { recipientId, senderId, type, relatedPost, relatedComment, relatedConversation } = data;

    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      relatedPost: relatedPost || null,
      relatedComment: relatedComment || null,
      relatedConversation: relatedConversation || null,
    });

    await notification.populate('sender', 'name profilePhoto');

    try {
      getIO().to(`user:${recipientId}`).emit('newNotification', notification);
    } catch {}
  } catch (err) {
    console.error('Notification job failed:', err.message);
  }
});

mediaQueue.process(async (data) => {
  try {
    const { type, filePath } = data;
    console.log(`Processing media: ${type} ${filePath}`);
  } catch (err) {
    console.error('Media job failed:', err.message);
  }
});

analyticsQueue.process(async (data) => {
  try {
    const { postId, type } = data;
    const post = await Post.findById(postId);
    if (!post) return;

    if (!post.analytics) post.analytics = {};
    if (type === 'impression') {
      post.analytics.impressions = (post.analytics.impressions || 0) + 1;
    } else if (type === 'click') {
      post.analytics.clicks = (post.analytics.clicks || 0) + 1;
    } else if (type === 'engagement') {
      post.analytics.engagement = (post.analytics.engagement || 0) + 1;
    }
    await post.save();
  } catch (err) {
    console.error('Analytics job failed:', err.message);
  }
});

cleanupQueue.process(async (data) => {
  try {
    const { type } = data;

    if (type === 'expired_stories') {
      const twentyFourHoursAgo = new Date(Date.now() - 86400000);
      await Story.deleteMany({ createdAt: { $lt: twentyFourHoursAgo } });
    } else if (type === 'old_notifications') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
      await Notification.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
    } else if (type === 'old_sessions') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
      await User.updateMany(
        {},
        { $pull: { sessions: { lastActive: { $lt: sevenDaysAgo } } } }
      );
    }
  } catch (err) {
    console.error('Cleanup job failed:', err.message);
  }
});

function startBackgroundJobs() {
  setInterval(() => {
    cleanupQueue.add({ type: 'expired_stories' });
  }, 3600000);

  setInterval(() => {
    cleanupQueue.add({ type: 'old_notifications' });
  }, 86400000);

  setInterval(() => {
    cleanupQueue.add({ type: 'old_sessions' });
  }, 86400000);

  setInterval(async () => {
    try {
      await DataRetention.runAllPolicies();
      console.log('Data retention enforced');
    } catch (err) {
      console.error('Data retention failed:', err.message);
    }
  }, 24 * 3600000);

  setInterval(async () => {
    try {
      await BackupService.createBackup('weekly');
      console.log('Weekly backup created');
    } catch (err) {
      console.error('Backup failed:', err.message);
    }
  }, 7 * 24 * 3600000);

  setInterval(async () => {
    try {
      await processScheduledPosts();
    } catch (err) {
      console.error('Scheduled posts processor failed:', err.message);
    }
  }, 60000);

  // Clean up expired restrictions every hour
  setInterval(async () => {
    try {
      const now = new Date();
      await User.updateMany(
        { 'restrictions.expiresAt': { $lte: now, $ne: null } },
        { $pull: { restrictions: { expiresAt: { $lte: now, $ne: null } } } }
      );
      console.log('Expired restrictions cleaned up');
    } catch (err) {
      console.error('Restriction cleanup failed:', err.message);
    }
  }, 3600000);

  // Auto-escalate old pending reports every 6 hours
  setInterval(async () => {
    try {
      const escalated = await autoEscalateReports();
      if (escalated > 0) console.log(`Auto-escalated ${escalated} reports`);
    } catch (err) {
      console.error('Auto-escalation failed:', err.message);
    }
  }, 6 * 3600000);

  console.log('Background jobs started');
}

module.exports = { startBackgroundJobs };
