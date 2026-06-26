const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getUsers, getUserDetails, suspendUser, banUser, deleteUser,
  warnUser, getWarnings, removeWarning,
  restrictUser, removeRestriction,
  verifyUser, requestVerification, getVerificationRequests,
  updateUserRole, getAdmins,
  removePost, removeComment, removeStory,
  getReports, updateReportStatus,
  getAppeals, handleAppeal,
  getAuditLog, getStats,
} = require('../controllers/adminController');

const {
  getFlaggedPosts, flagPost, hidePost, shadowHidePost, approvePost,
  getFlaggedComments, flagComment, hideComment, approveComment,
  getFlaggedStories, flagStory, hideStory, approveStory,
  getFlaggedReels, flagReel, hideReel, approveReel, removeReel,
  getGroupPosts,
  getListings, flagListing, hideListing, approveListing, removeListing,
  bulkAction, shadowHide, getContentStats,
} = require('../controllers/moderationController');

const {
  getReportDashboard, getReportsEnhanced, assignReport, escalateReport, resolveReport,
  scanForSpam, getSpamQueue, reviewSpamFlag,
  getFlagsByReason,
  getBlockedUsersOverview,
  getRepeatOffenders, flagRepeatOffender, clearRepeatOffender, updateSafetyScore,
  getSafetyAuditLogs,
  addModeratorNote, getCaseHistory, getUserCaseHistory,
  getEscalatedReports,
} = require('../controllers/safetyController');

const adminOnly = async (req, res, next) => {
  if (!req.user.isAdmin && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Role-based permission middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

router.use(protect);
router.use(adminOnly);

// Stats
router.get('/stats', getStats);

// User management (admin+ only)
router.get('/users', getUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id/suspend', requireRole('admin', 'superadmin'), suspendUser);
router.put('/users/:id/ban', requireRole('admin', 'superadmin'), banUser);
router.delete('/users/:id', requireRole('superadmin'), deleteUser);
router.put('/users/:id/role', requireRole('superadmin'), updateUserRole);

// Warnings (moderator+ can warn)
router.post('/users/:id/warn', warnUser);
router.get('/users/:id/warnings', getWarnings);
router.delete('/users/:userId/warnings/:warningId', requireRole('admin', 'superadmin'), removeWarning);

// Restrictions (admin+ only)
router.post('/users/:id/restrict', requireRole('admin', 'superadmin'), restrictUser);
router.delete('/users/:userId/restrictions/:restrictionId', requireRole('admin', 'superadmin'), removeRestriction);

// Verification (admin+ can verify)
router.put('/users/:id/verify', requireRole('admin', 'superadmin'), verifyUser);
router.get('/verification-requests', getVerificationRequests);

// Admin accounts (superadmin only for listing)
router.get('/admins', getAdmins);

// Content removal (moderator+ can remove)
router.delete('/posts/:id', removePost);
router.delete('/comments/:id', removeComment);
router.delete('/stories/:id', removeStory);

// Reports
router.get('/reports', getReports);
router.put('/reports/:id', updateReportStatus);

// Appeals
router.get('/appeals', getAppeals);
router.put('/appeals/:id', handleAppeal);

// Audit log
router.get('/audit-log', getAuditLog);

// Page verify
router.put('/pages/:id/verify', async (req, res) => {
  try {
    const Page = require('../models/Page');
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ message: 'Page not found' });
    page.isVerified = !page.isVerified;
    await page.save();
    res.json({ message: page.isVerified ? 'Page verified' : 'Page unverified', isVerified: page.isVerified });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============================================================
// CONTENT MODERATION
// ============================================================

// Moderation stats
router.get('/moderation/stats', getContentStats);

// Post moderation
router.get('/moderation/posts', getFlaggedPosts);
router.put('/moderation/posts/:id/flag', flagPost);
router.put('/moderation/posts/:id/hide', hidePost);
router.put('/moderation/posts/:id/shadow-hide', shadowHidePost);
router.put('/moderation/posts/:id/approve', approvePost);

// Comment moderation
router.get('/moderation/comments', getFlaggedComments);
router.put('/moderation/comments/:id/flag', flagComment);
router.put('/moderation/comments/:id/hide', hideComment);
router.put('/moderation/comments/:id/approve', approveComment);

// Story moderation
router.get('/moderation/stories', getFlaggedStories);
router.put('/moderation/stories/:id/flag', flagStory);
router.put('/moderation/stories/:id/hide', hideStory);
router.put('/moderation/stories/:id/approve', approveStory);

// Reel moderation
router.get('/moderation/reels', getFlaggedReels);
router.put('/moderation/reels/:id/flag', flagReel);
router.put('/moderation/reels/:id/hide', hideReel);
router.put('/moderation/reels/:id/approve', approveReel);
router.delete('/moderation/reels/:id', removeReel);

// Group post moderation
router.get('/moderation/group-posts', getGroupPosts);

// Marketplace listing moderation
router.get('/moderation/listings', getListings);
router.put('/moderation/listings/:id/flag', flagListing);
router.put('/moderation/listings/:id/hide', hideListing);
router.put('/moderation/listings/:id/approve', approveListing);
router.put('/moderation/listings/:id/remove', removeListing);

// Bulk actions
router.post('/moderation/bulk', bulkAction);

// Shadow moderation (generic)
router.put('/moderation/:type/:id/shadow-hide', shadowHide);

// ============================================================
// REPORTS & SAFETY
// ============================================================

// Report dashboard
router.get('/safety/dashboard', getReportDashboard);

// Enhanced reports
router.get('/safety/reports', getReportsEnhanced);
router.put('/safety/reports/:id/assign', assignReport);
router.put('/safety/reports/:id/escalate', escalateReport);
router.put('/safety/reports/:id/resolve', resolveReport);
router.get('/safety/reports/escalated', getEscalatedReports);
router.get('/safety/reports/flags', getFlagsByReason);

// Spam detection
router.get('/safety/spam/scan', scanForSpam);
router.get('/safety/spam/queue', getSpamQueue);
router.put('/safety/spam/:id/review', reviewSpamFlag);

// Blocked users overview
router.get('/safety/blocked-users', getBlockedUsersOverview);

// Repeat offender tracking
router.get('/safety/repeat-offenders', getRepeatOffenders);
router.put('/safety/repeat-offenders/:id/flag', flagRepeatOffender);
router.put('/safety/repeat-offenders/:id/clear', clearRepeatOffender);
router.put('/safety/users/:id/safety-score', updateSafetyScore);

// Safety audit logs
router.get('/safety/audit-logs', getSafetyAuditLogs);

// Moderator notes & case history
router.post('/safety/notes', addModeratorNote);
router.get('/safety/case-history/:targetType/:targetId', getCaseHistory);
router.get('/safety/user-case-history/:id', getUserCaseHistory);

// --- Analytics ---
const {
  getAnalyticsOverview, getUserGrowth, getActiveUsers, getRetention,
  getEngagementStats, getContentTrends,
  getModerationStats, getModeratorPerformance,
  getRevenueStats,
} = require('../controllers/analyticsController');

router.get('/analytics/overview', getAnalyticsOverview);
router.get('/analytics/user-growth', getUserGrowth);
router.get('/analytics/active-users', getActiveUsers);
router.get('/analytics/retention', getRetention);
router.get('/analytics/engagement', getEngagementStats);
router.get('/analytics/content-trends', getContentTrends);
router.get('/analytics/moderation-stats', getModerationStats);
router.get('/analytics/moderator-performance', getModeratorPerformance);
router.get('/analytics/revenue', getRevenueStats);

// --- System Control ---
const {
  getSettings, updateSetting, updateSettingsBulk,
  getFeatureFlags, toggleFeature,
  getMaintenance, toggleMaintenance,
  getAnnouncement, updateAnnouncement,
  getApiHealth, getJobStatus, clearFailedJobs, toggleQueue,
  getErrorLogs, clearErrors,
  getCacheStatus, flushCache,
  getDbOverview,
} = require('../controllers/systemController');

// Site settings
router.get('/system/settings', getSettings);
router.put('/system/settings/:key', requireRole('superadmin'), updateSetting);
router.put('/system/settings', requireRole('superadmin'), updateSettingsBulk);

// Feature flags
router.get('/system/features', getFeatureFlags);
router.put('/system/features/:key/toggle', requireRole('superadmin'), toggleFeature);

// Maintenance mode
router.get('/system/maintenance', getMaintenance);
router.put('/system/maintenance/toggle', requireRole('superadmin'), toggleMaintenance);

// Announcement
router.get('/system/announcement', getAnnouncement);
router.put('/system/announcement', requireRole('admin', 'superadmin'), updateAnnouncement);

// API health
router.get('/system/health', getApiHealth);

// Background jobs
router.get('/system/jobs', getJobStatus);
router.post('/system/jobs/cleanup', requireRole('superadmin'), clearFailedJobs);
router.put('/system/jobs/toggle', requireRole('superadmin'), toggleQueue);

// Error logs
router.get('/system/errors', getErrorLogs);
router.post('/system/errors/clear', requireRole('superadmin'), clearErrors);

// Cache
router.get('/system/cache', getCacheStatus);
router.post('/system/cache/flush', requireRole('superadmin'), flushCache);

// Database
router.get('/system/database', requireRole('superadmin'), getDbOverview);

module.exports = router;
