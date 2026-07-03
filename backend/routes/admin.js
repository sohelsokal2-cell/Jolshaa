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
  adminVerdict,
  getFlaggedPosts: getFactCheckFlaggedPosts,
} = require('../controllers/factCheckController');

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

const {
  getAdDashboard, getAllAds, updateAdStatus, getAdStats,
  approveBoost, rejectBoost, getBoostStats,
  getPayoutDashboard, getAllPayouts, processPayout, getCreatorEarnings,
  getSubscriptionDashboard, getAllSubscriptions, updatePlanStatus,
  getTipsDashboard, getTipHistory,
  getTransactionDashboard, getAllTransactions, exportTransactions,
  getRefundDashboard, getAllRefunds, processRefund, createRefund,
  getFraudDashboard, getAllFraudAlerts, createFraudAlert, updateFraudAlert, autoDetectFraud,
} = require('../controllers/monetizationController');
const { getBoostedPosts: getBoostedPostsMonetization } = require('../controllers/monetizationController');

const {
  getGroupDashboard, getAllGroups, approveGroup, removeGroup, updateGroupPrivacy,
  getPageDashboard, getAllPages, verifyPage, unverifyPage, removePage,
  getEventDashboard, getAllEvents, removeEvent, flagEvent,
  getViolationDashboard, getAllViolations, issueViolation, revokeViolation,
  getAutoModRules, createAutoModRule, updateAutoModRule, deleteAutoModRule, toggleAutoModRule,
  getKeywords, addKeyword, addBulkKeywords, updateKeyword, deleteKeyword, toggleKeyword,
  getLinks, addLink, addBulkLinks, updateLink, deleteLink, toggleLink,
  getMediaRestrictions, addMediaRestriction, updateMediaRestriction, deleteMediaRestriction, toggleMediaRestriction,
} = require('../controllers/communityController');

const {
  globalSearch, getFilteredUsers, getFilteredPosts, getFilteredReports,
  exportCSV, getAuditTrail, getAuditStats,
  getNotes, addNote, deleteNote,
  bulkImport, createUndoSnapshot, undoAction, getUndoHistory,
  getOpsDashboard,
} = require('../controllers/opsController');

const adminOnly = async (req, res, next) => {
  if (!req.user.isAdmin && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Role-based permission middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (req.user.isAdmin || roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ message: 'Insufficient permissions' });
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
// FACT-CHECK REVIEW
// ============================================================
router.get('/factcheck/flagged', requireRole('admin', 'superadmin'), getFactCheckFlaggedPosts);
router.put('/posts/:id/factcheck/verdict', requireRole('admin', 'superadmin'), adminVerdict);

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
  getCronJobs, triggerCronJob: triggerCronJobController, toggleCronJob: toggleCronJobController,
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

// Cron / Scheduler jobs
router.get('/system/cron-jobs', requireRole('superadmin'), getCronJobs);
router.post('/system/cron-jobs/:name/trigger', requireRole('superadmin'), triggerCronJobController);
router.put('/system/cron-jobs/:name/toggle', requireRole('superadmin'), toggleCronJobController);

// ============================================================
// SECURITY
// ============================================================
const {
  getAdminLoginAudit,
  getSuspiciousLogins,
  getAdminSessions,
  revokeAdminSession,
  revokeAllAdminSessions,
  get2FAStatus,
  enable2FA,
  verify2FA,
  disable2FA,
  get2FAEnforcement,
  getIPDeviceHistory,
  getPermissionChangeLog,
  adminResetPassword,
  getRateLimitAbuse,
  getDataExportRestrictions,
  exportUserData,
} = require('../controllers/securityController');

// Admin login audit
router.get('/security/login-audit', requireRole('admin', 'superadmin'), getAdminLoginAudit);

// Suspicious login detection
router.get('/security/suspicious-logins', requireRole('admin', 'superadmin'), getSuspiciousLogins);

// Admin session management
router.get('/security/sessions', requireRole('admin', 'superadmin'), getAdminSessions);
router.delete('/security/sessions/:userId/:sessionId', requireRole('superadmin'), revokeAdminSession);
router.delete('/security/sessions/:userId', requireRole('superadmin'), revokeAllAdminSessions);

// 2FA
router.get('/security/2fa/status', requireRole('admin', 'superadmin'), get2FAStatus);
router.post('/security/2fa/enable', requireRole('admin', 'superadmin'), enable2FA);
router.post('/security/2fa/verify', requireRole('admin', 'superadmin'), verify2FA);
router.post('/security/2fa/disable', requireRole('admin', 'superadmin'), disable2FA);
router.get('/security/2fa/enforcement', requireRole('superadmin'), get2FAEnforcement);

// IP / Device history
router.get('/security/ip-history', requireRole('admin', 'superadmin'), getIPDeviceHistory);

// Permission change log
router.get('/security/permission-log', requireRole('admin', 'superadmin'), getPermissionChangeLog);

// Admin password reset
router.post('/security/reset-password/:userId', requireRole('superadmin'), adminResetPassword);

// Rate-limit abuse review
router.get('/security/rate-limit-abuse', requireRole('admin', 'superadmin'), getRateLimitAbuse);

// Data export
router.get('/security/data-export', requireRole('superadmin'), getDataExportRestrictions);
router.get('/security/export-user/:userId', requireRole('superadmin'), exportUserData);

// ============================================================
// USER SUPPORT
// ============================================================
const {
  getTickets, getTicketById, updateTicket, replyToTicket, deleteTicket, getTicketStats,
  getContactMessages, updateContactMessage, deleteContactMessage, getContactStats,
  getFeedback, updateFeedback, deleteFeedback, getFeedbackStats,
  getRecoveryRequests, handleRecovery, getRecoveryStats,
  getEmailDeliveryStatus, getEmailDeliveryStats,
  getFAQs, createFAQ, updateFAQ, deleteFAQ, reorderFAQs,
  findDuplicateUsers, mergeUsers,
  getSupportDashboard,
} = require('../controllers/supportController');

// Support dashboard
router.get('/support/dashboard', requireRole('admin', 'superadmin'), getSupportDashboard);

// Support tickets
router.get('/support/tickets', requireRole('admin', 'superadmin'), getTickets);
router.get('/support/tickets/stats', requireRole('admin', 'superadmin'), getTicketStats);
router.get('/support/tickets/:id', requireRole('admin', 'superadmin'), getTicketById);
router.put('/support/tickets/:id', requireRole('admin', 'superadmin'), updateTicket);
router.post('/support/tickets/:id/reply', requireRole('admin', 'superadmin'), replyToTicket);
router.delete('/support/tickets/:id', requireRole('superadmin'), deleteTicket);

// Contact form inbox
router.get('/support/contact', requireRole('admin', 'superadmin'), getContactMessages);
router.get('/support/contact/stats', requireRole('admin', 'superadmin'), getContactStats);
router.put('/support/contact/:id', requireRole('admin', 'superadmin'), updateContactMessage);
router.delete('/support/contact/:id', requireRole('superadmin'), deleteContactMessage);

// User feedback
router.get('/support/feedback', requireRole('admin', 'superadmin'), getFeedback);
router.get('/support/feedback/stats', requireRole('admin', 'superadmin'), getFeedbackStats);
router.put('/support/feedback/:id', requireRole('admin', 'superadmin'), updateFeedback);
router.delete('/support/feedback/:id', requireRole('superadmin'), deleteFeedback);

// Account recovery
router.get('/support/recovery', requireRole('admin', 'superadmin'), getRecoveryRequests);
router.get('/support/recovery/stats', requireRole('admin', 'superadmin'), getRecoveryStats);
router.put('/support/recovery/:id', requireRole('admin', 'superadmin'), handleRecovery);

// Email/SMS delivery
router.get('/support/email-delivery', requireRole('admin', 'superadmin'), getEmailDeliveryStatus);
router.get('/support/email-delivery/stats', requireRole('admin', 'superadmin'), getEmailDeliveryStats);

// FAQ management
router.get('/support/faq', requireRole('admin', 'superadmin'), getFAQs);
router.post('/support/faq', requireRole('admin', 'superadmin'), createFAQ);
router.put('/support/faq/:id', requireRole('admin', 'superadmin'), updateFAQ);
router.delete('/support/faq/:id', requireRole('superadmin'), deleteFAQ);
router.put('/support/faq/reorder', requireRole('admin', 'superadmin'), reorderFAQs);

// User merge/dedup
router.get('/support/duplicates', requireRole('superadmin'), findDuplicateUsers);
router.post('/support/merge', requireRole('superadmin'), mergeUsers);

// ============================================================
// CONTENT TOOLS
// ============================================================
const {
  getTrendingTopics, updateTrendingScore, recalculateTrending,
  getHashtags, updateHashtag, deleteHashtag, syncHashtagCounts,
  getTopics, createTopic, updateTopic, deleteTopic, reorderTopics,
  getPinnedPosts, pinPost, unpinPost,
  getSponsoredPosts, reviewAd, getBoostedPosts, reviewBoost,
  getFeaturedContent, addFeaturedContent, updateFeaturedContent, removeFeaturedContent,
  getPendingApprovals, handleApproval, submitForApproval,
  getPageVerificationQueue, getGroupApprovalQueue,
  getRecommendationConfig, updateRecommendationConfig, getRecommendationStats,
  getContentDashboard,
} = require('../controllers/contentToolsController');

// Content dashboard
router.get('/content/dashboard', requireRole('admin', 'superadmin'), getContentDashboard);

// Trending topics
router.get('/content/trending', requireRole('admin', 'superadmin'), getTrendingTopics);
router.put('/content/trending/:topicId', requireRole('superadmin'), updateTrendingScore);
router.post('/content/trending/recalculate', requireRole('superadmin'), recalculateTrending);

// Hashtag management
router.get('/content/hashtags', requireRole('admin', 'superadmin'), getHashtags);
router.put('/content/hashtags/:id', requireRole('admin', 'superadmin'), updateHashtag);
router.delete('/content/hashtags/:id', requireRole('superadmin'), deleteHashtag);
router.post('/content/hashtags/sync', requireRole('superadmin'), syncHashtagCounts);

// Topic management
router.get('/content/topics', requireRole('admin', 'superadmin'), getTopics);
router.post('/content/topics', requireRole('superadmin'), createTopic);
router.put('/content/topics/:id', requireRole('superadmin'), updateTopic);
router.delete('/content/topics/:id', requireRole('superadmin'), deleteTopic);
router.put('/content/topics/reorder', requireRole('superadmin'), reorderTopics);

// Pinned posts
router.get('/content/pinned', requireRole('admin', 'superadmin'), getPinnedPosts);
router.post('/content/pinned', requireRole('admin', 'superadmin'), pinPost);
router.delete('/content/pinned/:id', requireRole('admin', 'superadmin'), unpinPost);

// Sponsored/boosted posts
router.get('/content/sponsored', requireRole('admin', 'superadmin'), getSponsoredPosts);
router.put('/content/sponsored/:id/review', requireRole('admin', 'superadmin'), reviewAd);
router.get('/content/boosted', requireRole('admin', 'superadmin'), getBoostedPosts);
router.put('/content/boosted/:id/review', requireRole('admin', 'superadmin'), reviewBoost);

// Featured content
router.get('/content/featured', requireRole('admin', 'superadmin'), getFeaturedContent);
router.post('/content/featured', requireRole('admin', 'superadmin'), addFeaturedContent);
router.put('/content/featured/:id', requireRole('admin', 'superadmin'), updateFeaturedContent);
router.delete('/content/featured/:id', requireRole('superadmin'), removeFeaturedContent);

// Approvals
router.get('/content/approvals', requireRole('admin', 'superadmin'), getPendingApprovals);
router.put('/content/approvals/:id', requireRole('admin', 'superadmin'), handleApproval);
router.post('/content/approvals/submit', requireRole('admin', 'superadmin'), submitForApproval);
router.get('/content/approvals/pages', requireRole('admin', 'superadmin'), getPageVerificationQueue);
router.get('/content/approvals/groups', requireRole('admin', 'superadmin'), getGroupApprovalQueue);

// Recommendations
router.get('/content/recommendations/config', requireRole('superadmin'), getRecommendationConfig);
router.put('/content/recommendations/config', requireRole('superadmin'), updateRecommendationConfig);
router.get('/content/recommendations/stats', requireRole('admin', 'superadmin'), getRecommendationStats);

// ============================================================
// MONETIZATION
// ============================================================

// Ads management
router.get('/monetization/ads/dashboard', requireRole('admin', 'superadmin'), getAdDashboard);
router.get('/monetization/ads', requireRole('admin', 'superadmin'), getAllAds);
router.put('/monetization/ads/:adId/status', requireRole('admin', 'superadmin'), updateAdStatus);
router.get('/monetization/ads/stats', requireRole('admin', 'superadmin'), getAdStats);

// Boosted posts
router.get('/monetization/boosts', requireRole('admin', 'superadmin'), getBoostedPostsMonetization);
router.put('/monetization/boosts/:postId/approve', requireRole('admin', 'superadmin'), approveBoost);
router.put('/monetization/boosts/:postId/reject', requireRole('admin', 'superadmin'), rejectBoost);
router.get('/monetization/boosts/stats', requireRole('admin', 'superadmin'), getBoostStats);

// Creator payouts
router.get('/monetization/payouts/dashboard', requireRole('admin', 'superadmin'), getPayoutDashboard);
router.get('/monetization/payouts', requireRole('admin', 'superadmin'), getAllPayouts);
router.put('/monetization/payouts/:payoutId', requireRole('admin', 'superadmin'), processPayout);
router.get('/monetization/payouts/earnings', requireRole('admin', 'superadmin'), getCreatorEarnings);

// Subscriptions
router.get('/monetization/subscriptions/dashboard', requireRole('admin', 'superadmin'), getSubscriptionDashboard);
router.get('/monetization/subscriptions', requireRole('admin', 'superadmin'), getAllSubscriptions);
router.put('/monetization/subscriptions/:planId', requireRole('admin', 'superadmin'), updatePlanStatus);

// Tips
router.get('/monetization/tips/dashboard', requireRole('admin', 'superadmin'), getTipsDashboard);
router.get('/monetization/tips', requireRole('admin', 'superadmin'), getTipHistory);

// Transactions
router.get('/monetization/transactions/dashboard', requireRole('admin', 'superadmin'), getTransactionDashboard);
router.get('/monetization/transactions', requireRole('admin', 'superadmin'), getAllTransactions);
router.get('/monetization/transactions/export', requireRole('admin', 'superadmin'), exportTransactions);

// Refunds
router.get('/monetization/refunds/dashboard', requireRole('admin', 'superadmin'), getRefundDashboard);
router.get('/monetization/refunds', requireRole('admin', 'superadmin'), getAllRefunds);
router.put('/monetization/refunds/:refundId', requireRole('admin', 'superadmin'), processRefund);
router.post('/monetization/refunds', requireRole('admin', 'superadmin'), createRefund);

// Fraud detection
router.get('/monetization/fraud/dashboard', requireRole('admin', 'superadmin'), getFraudDashboard);
router.get('/monetization/fraud', requireRole('admin', 'superadmin'), getAllFraudAlerts);
router.post('/monetization/fraud', requireRole('admin', 'superadmin'), createFraudAlert);
router.put('/monetization/fraud/:alertId', requireRole('admin', 'superadmin'), updateFraudAlert);
router.post('/monetization/fraud/scan', requireRole('admin', 'superadmin'), autoDetectFraud);

// ============================================================
// COMMUNITY MANAGEMENT
// ============================================================

// Group approval
router.get('/community/groups/dashboard', requireRole('admin', 'superadmin'), getGroupDashboard);
router.get('/community/groups', requireRole('admin', 'superadmin'), getAllGroups);
router.put('/community/groups/:groupId/approve', requireRole('admin', 'superadmin'), approveGroup);
router.delete('/community/groups/:groupId', requireRole('superadmin'), removeGroup);
router.put('/community/groups/:groupId/privacy', requireRole('admin', 'superadmin'), updateGroupPrivacy);

// Page verification
router.get('/community/pages/dashboard', requireRole('admin', 'superadmin'), getPageDashboard);
router.get('/community/pages', requireRole('admin', 'superadmin'), getAllPages);
router.put('/community/pages/:pageId/verify', requireRole('admin', 'superadmin'), verifyPage);
router.put('/community/pages/:pageId/unverify', requireRole('admin', 'superadmin'), unverifyPage);
router.delete('/community/pages/:pageId', requireRole('superadmin'), removePage);

// Event moderation
router.get('/community/events/dashboard', requireRole('admin', 'superadmin'), getEventDashboard);
router.get('/community/events', requireRole('admin', 'superadmin'), getAllEvents);
router.delete('/community/events/:eventId', requireRole('superadmin'), removeEvent);
router.post('/community/events/:eventId/flag', requireRole('admin', 'superadmin'), flagEvent);

// Guideline violations
router.get('/community/violations/dashboard', requireRole('admin', 'superadmin'), getViolationDashboard);
router.get('/community/violations', requireRole('admin', 'superadmin'), getAllViolations);
router.post('/community/violations', requireRole('admin', 'superadmin'), issueViolation);
router.put('/community/violations/:violationId/revoke', requireRole('admin', 'superadmin'), revokeViolation);

// Auto-moderation rules
router.get('/community/automod', requireRole('admin', 'superadmin'), getAutoModRules);
router.post('/community/automod', requireRole('admin', 'superadmin'), createAutoModRule);
router.put('/community/automod/:ruleId', requireRole('admin', 'superadmin'), updateAutoModRule);
router.delete('/community/automod/:ruleId', requireRole('superadmin'), deleteAutoModRule);
router.put('/community/automod/:ruleId/toggle', requireRole('admin', 'superadmin'), toggleAutoModRule);

// Keyword blacklist
router.get('/community/keywords', requireRole('admin', 'superadmin'), getKeywords);
router.post('/community/keywords', requireRole('admin', 'superadmin'), addKeyword);
router.post('/community/keywords/bulk', requireRole('admin', 'superadmin'), addBulkKeywords);
router.put('/community/keywords/:keywordId', requireRole('admin', 'superadmin'), updateKeyword);
router.delete('/community/keywords/:keywordId', requireRole('superadmin'), deleteKeyword);
router.put('/community/keywords/:keywordId/toggle', requireRole('admin', 'superadmin'), toggleKeyword);

// Link blacklist
router.get('/community/links', requireRole('admin', 'superadmin'), getLinks);
router.post('/community/links', requireRole('admin', 'superadmin'), addLink);
router.post('/community/links/bulk', requireRole('admin', 'superadmin'), addBulkLinks);
router.put('/community/links/:linkId', requireRole('admin', 'superadmin'), updateLink);
router.delete('/community/links/:linkId', requireRole('superadmin'), deleteLink);
router.put('/community/links/:linkId/toggle', requireRole('admin', 'superadmin'), toggleLink);

// Media restrictions
router.get('/community/media', requireRole('admin', 'superadmin'), getMediaRestrictions);
router.post('/community/media', requireRole('admin', 'superadmin'), addMediaRestriction);
router.put('/community/media/:restrictionId', requireRole('admin', 'superadmin'), updateMediaRestriction);
router.delete('/community/media/:restrictionId', requireRole('superadmin'), deleteMediaRestriction);
router.put('/community/media/:restrictionId/toggle', requireRole('admin', 'superadmin'), toggleMediaRestriction);

// ============================================================
// OPS / ADMIN QUALITY
// ============================================================

// Dashboard
router.get('/ops/dashboard', requireRole('admin', 'superadmin'), getOpsDashboard);

// Global search
router.get('/ops/search', requireRole('admin', 'superadmin'), globalSearch);

// Filtered queries
router.get('/ops/users', requireRole('admin', 'superadmin'), getFilteredUsers);
router.get('/ops/posts', requireRole('admin', 'superadmin'), getFilteredPosts);
router.get('/ops/reports-filter', requireRole('admin', 'superadmin'), getFilteredReports);

// CSV export
router.get('/ops/export', requireRole('admin', 'superadmin'), exportCSV);

// Audit trail
router.get('/ops/audit', requireRole('admin', 'superadmin'), getAuditTrail);
router.get('/ops/audit/stats', requireRole('admin', 'superadmin'), getAuditStats);

// Notes
router.get('/ops/notes', requireRole('admin', 'superadmin'), getNotes);
router.post('/ops/notes', requireRole('admin', 'superadmin'), addNote);
router.delete('/ops/notes/:noteId', requireRole('admin', 'superadmin'), deleteNote);

// Bulk import
router.post('/ops/bulk-import', requireRole('admin', 'superadmin'), bulkImport);

// Undo
router.post('/ops/undo/snapshot', requireRole('admin', 'superadmin'), createUndoSnapshot);
router.put('/ops/undo/:undoId', requireRole('admin', 'superadmin'), undoAction);
router.get('/ops/undo/history', requireRole('admin', 'superadmin'), getUndoHistory);

module.exports = router;
