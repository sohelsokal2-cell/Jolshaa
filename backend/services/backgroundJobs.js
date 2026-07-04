const { notificationQueue, mediaQueue, analyticsQueue, cleanupQueue } = require('./queue');
const Notification = require('../models/Notification');
const Post = require('../models/Post');
const Story = require('../models/Story');
const User = require('../models/User');
const RevenueShareConfig = require('../models/RevenueShareConfig');
const { getIO } = require('../socket');
const DataRetention = require('./dataRetention');
const BackupService = require('./backup');
const { processScheduledPosts } = require('../controllers/schedulerController');
const { autoEscalateReports } = require('../controllers/safetyController');

// --- Cron Job Tracker ---
const cronJobs = new Map();

function trackCronJob(name, intervalMs, handler) {
  const job = {
    name,
    intervalMs,
    lastRun: null,
    nextRun: null,
    runCount: 0,
    failCount: 0,
    lastError: null,
    lastDuration: null,
    enabled: true,
    timerId: null,
  };

  const wrappedHandler = async () => {
    const start = Date.now();
    job.lastRun = new Date();
    job.nextRun = new Date(Date.now() + job.intervalMs);
    job.runCount += 1;
    try {
      await handler();
      job.lastDuration = Date.now() - start;
      job.lastError = null;
    } catch (err) {
      job.failCount += 1;
      job.lastError = err.message;
      job.lastDuration = Date.now() - start;
    }
  };

  job.handler = wrappedHandler;
  job.timerId = setInterval(wrappedHandler, intervalMs);
  job.nextRun = new Date(Date.now() + intervalMs);
  cronJobs.set(name, job);
}

function getCronJobsStatus() {
  const jobs = [];
  for (const [name, job] of cronJobs) {
    jobs.push({
      name,
      intervalMs: job.intervalMs,
      intervalLabel: formatInterval(job.intervalMs),
      lastRun: job.lastRun,
      nextRun: job.nextRun,
      runCount: job.runCount,
      failCount: job.failCount,
      lastError: job.lastError,
      lastDuration: job.lastDuration,
      enabled: job.enabled,
    });
  }
  return jobs;
}

function formatInterval(ms) {
  if (ms <= 60000) return `${ms / 1000}s`;
  if (ms <= 3600000) return `${ms / 60000}m`;
  if (ms <= 86400000) return `${ms / 3600000}h`;
  return `${ms / 86400000}d`;
}

function triggerCronJob(name) {
  const job = cronJobs.get(name);
  if (job && job.handler) {
    job.handler();
    return true;
  }
  return false;
}

function toggleCronJob(name, enabled) {
  const job = cronJobs.get(name);
  if (!job) return false;
  job.enabled = enabled;
  if (enabled) {
    clearInterval(job.timerId);
    job.timerId = setInterval(job.handler, job.intervalMs);
    job.nextRun = new Date(Date.now() + job.intervalMs);
  } else {
    clearInterval(job.timerId);
    job.timerId = null;
    job.nextRun = null;
  }
  return true;
}

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
  // Initialize RevenueShareConfig with default values if none exists
  RevenueShareConfig.findOne().then(existing => {
    if (!existing) {
      RevenueShareConfig.create({
        videoAdRevenueShare: { creator: 55, platform: 45 },
        starGiftRevenueShare: { creator: 70, platform: 30 },
        subscriptionRevenueShare: { creator: 80, platform: 20 },
        starPackages: [
          { stars: 10, priceBDT: 50 },
          { stars: 25, priceBDT: 100 },
          { stars: 50, priceBDT: 200 },
          { stars: 100, priceBDT: 400 },
          { stars: 200, priceBDT: 750 },
          { stars: 500, priceBDT: 1800 },
        ],
        adRevenuePerView: 0.50,
        minimumPayout: 1000,
        payoutProcessingDays: 5,
      }).then(() => console.log('RevenueShareConfig initialized with defaults'));
    }
  }).catch(err => console.error('Failed to initialize RevenueShareConfig:', err.message));

  trackCronJob('expired_stories_cleanup', 3600000, async () => {
    cleanupQueue.add({ type: 'expired_stories' });
  });

  trackCronJob('old_notifications_cleanup', 86400000, async () => {
    cleanupQueue.add({ type: 'old_notifications' });
  });

  trackCronJob('old_sessions_cleanup', 86400000, async () => {
    cleanupQueue.add({ type: 'old_sessions' });
  });

  trackCronJob('data_retention', 24 * 3600000, async () => {
    await DataRetention.runAllPolicies();
    console.log('Data retention enforced');
  });

  trackCronJob('weekly_backup', 7 * 24 * 3600000, async () => {
    await BackupService.createBackup('weekly');
    console.log('Weekly backup created');
  });

  trackCronJob('scheduled_posts_processor', 60000, async () => {
    await processScheduledPosts();
  });

  trackCronJob('expired_restrictions_cleanup', 3600000, async () => {
    const now = new Date();
    await User.updateMany(
      { 'restrictions.expiresAt': { $lte: now, $ne: null } },
      { $pull: { restrictions: { expiresAt: { $lte: now, $ne: null } } } }
    );
    console.log('Expired restrictions cleaned up');
  });

  trackCronJob('auto_escalate_reports', 6 * 3600000, async () => {
    const escalated = await autoEscalateReports();
    if (escalated > 0) console.log(`Auto-escalated ${escalated} reports`);
  });

  console.log('Background jobs started');
}

module.exports = {
  startBackgroundJobs,
  getCronJobsStatus,
  triggerCronJob,
  toggleCronJob,
};
