const SystemSetting = require('../models/SystemSetting');
const AdminAction = require('../models/AdminAction');
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Group = require('../models/Group');
const Story = require('../models/Story');
const Reel = require('../models/Reel');
const Listing = require('../models/Listing');
const { getPerformanceStats, getSystemHealth } = require('../services/performanceMonitor');
const { ErrorMonitor } = require('../services/errorMonitor');
const { queue } = require('../services/queue');
const { cacheGet, cacheSet, cacheDel, cacheDelPattern, isRedisAvailable, CACHE_KEYS } = require('../services/cache');
const { setMaintenanceMode } = require('../middleware/maintenance');

const logAction = async (admin, action, details = {}) => {
  try {
    await AdminAction.create({ admin, action, targetType: 'System', targetId: null, targetName: 'system', details });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

// --- Default Settings ---
const DEFAULT_SETTINGS = {
  site_name: { value: 'Jolshaa', category: 'site', description: 'Site name displayed in UI' },
  site_description: { value: 'Social media platform', category: 'site', description: 'Site tagline/description' },
  site_url: { value: '', category: 'site', description: 'Primary site URL' },
  support_email: { value: '', category: 'site', description: 'Support contact email' },
  allow_signup: { value: true, category: 'feature', description: 'Allow new user registrations' },
  allow_stories: { value: true, category: 'feature', description: 'Enable stories feature' },
  allow_reels: { value: true, category: 'feature', description: 'Enable reels feature' },
  allow_marketplace: { value: true, category: 'feature', description: 'Enable marketplace feature' },
  allow_groups: { value: true, category: 'feature', description: 'Enable groups feature' },
  allow_pages: { value: true, category: 'feature', description: 'Enable pages feature' },
  allow_events: { value: true, category: 'feature', description: 'Enable events feature' },
  allow_messaging: { value: true, category: 'feature', description: 'Enable direct messaging' },
  allow_live: { value: true, category: 'feature', description: 'Enable live streaming' },
  allow_creator_program: { value: true, category: 'feature', description: 'Enable creator monetization' },
  allow_ads: { value: true, category: 'feature', description: 'Enable advertising system' },
  require_email_verification: { value: true, category: 'security', description: 'Require email verification on signup' },
  min_password_length: { value: 6, category: 'security', description: 'Minimum password length' },
  max_upload_size_mb: { value: 10, category: 'upload', description: 'Max file upload size in MB' },
  maintenance_mode: { value: false, category: 'maintenance', description: 'Enable maintenance mode' },
  maintenance_message: { value: 'We are currently undergoing scheduled maintenance. Please check back soon.', category: 'maintenance', description: 'Message shown during maintenance' },
  announcement_enabled: { value: false, category: 'announcement', description: 'Show announcement banner' },
  announcement_text: { value: '', category: 'announcement', description: 'Banner announcement text' },
  announcement_type: { value: 'info', category: 'announcement', description: 'Banner type: info, warning, success, error' },
  announcement_link: { value: '', category: 'announcement', description: 'Optional link URL for banner' },
  announcement_dismissable: { value: true, category: 'announcement', description: 'Allow users to dismiss the banner' },
};

// --- Site Settings ---
exports.getSettings = async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    const settings = await SystemSetting.find(query).sort({ key: 1 });

    // Merge with defaults
    const result = {};
    for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
      if (category && def.category !== category) continue;
      const existing = settings.find(s => s.key === key);
      result[key] = {
        value: existing ? existing.value : def.value,
        category: def.category,
        description: def.description,
        updatedAt: existing?.updatedAt,
      };
    }
    // Add any custom settings not in defaults
    settings.forEach(s => {
      if (!result[s.key]) {
        result[s.key] = { value: s.value, category: s.category, description: s.description, updatedAt: s.updatedAt };
      }
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    const setting = await SystemSetting.findOneAndUpdate(
      { key },
      { value, description, updatedBy: req.user._id },
      { upsert: true, new: true }
    );

    await logAction(req.user._id, 'system.setting.update', { key, value, oldValue: 'N/A' });
    res.json({ setting });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateSettingsBulk = async (req, res) => {
  try {
    const { settings } = req.body;
    const updates = [];
    for (const [key, value] of Object.entries(settings)) {
      updates.push(
        SystemSetting.findOneAndUpdate(
          { key },
          { value, updatedBy: req.user._id },
          { upsert: true, new: true }
        )
      );
    }
    await Promise.all(updates);
    await logAction(req.user._id, 'system.settings.bulk_update', { keys: Object.keys(settings) });
    res.json({ message: 'Settings updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Feature Flags ---
exports.getFeatureFlags = async (req, res) => {
  try {
    const features = await SystemSetting.find({ category: 'feature' });
    const result = {};
    for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
      if (def.category !== 'feature') continue;
      const existing = features.find(f => f.key === key);
      result[key] = existing ? existing.value : def.value;
    }
    features.forEach(f => { if (!result[f.key]) result[f.key] = f.value; });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleFeature = async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await SystemSetting.findOne({ key });
    const newVal = setting ? !setting.value : false;

    await SystemSetting.findOneAndUpdate(
      { key },
      { value: newVal, updatedBy: req.user._id },
      { upsert: true, new: true }
    );

    await logAction(req.user._id, 'system.feature.toggle', { key, enabled: newVal });
    res.json({ key, enabled: newVal });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Maintenance Mode ---
exports.getMaintenance = async (req, res) => {
  try {
    const mode = await SystemSetting.findOne({ key: 'maintenance_mode' });
    const message = await SystemSetting.findOne({ key: 'maintenance_message' });
    res.json({
      enabled: mode?.value ?? false,
      message: message?.value ?? 'System under maintenance',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleMaintenance = async (req, res) => {
  try {
    const current = await SystemSetting.findOne({ key: 'maintenance_mode' });
    const newVal = current ? !current.value : true;

    await SystemSetting.findOneAndUpdate(
      { key: 'maintenance_mode' },
      { value: newVal, updatedBy: req.user._id },
      { upsert: true }
    );

    // Update in-memory maintenance state
    const msgSetting = await SystemSetting.findOne({ key: 'maintenance_message' });
    setMaintenanceMode(newVal, msgSetting?.value);

    await logAction(req.user._id, 'system.maintenance.toggle', { enabled: newVal });
    res.json({ enabled: newVal });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Announcement ---
exports.getAnnouncement = async (req, res) => {
  try {
    const settings = await SystemSetting.find({ category: 'announcement' });
    const result = {};
    settings.forEach(s => { result[s.key] = s.value; });
    res.json({
      enabled: result.announcement_enabled ?? false,
      text: result.announcement_text ?? '',
      type: result.announcement_type ?? 'info',
      link: result.announcement_link ?? '',
      dismissable: result.announcement_dismissable ?? true,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    const { enabled, text, type, link, dismissable } = req.body;
    const updates = [
      SystemSetting.findOneAndUpdate({ key: 'announcement_enabled' }, { value: enabled, updatedBy: req.user._id }, { upsert: true }),
      SystemSetting.findOneAndUpdate({ key: 'announcement_text' }, { value: text, updatedBy: req.user._id }, { upsert: true }),
      SystemSetting.findOneAndUpdate({ key: 'announcement_type' }, { value: type, updatedBy: req.user._id }, { upsert: true }),
      SystemSetting.findOneAndUpdate({ key: 'announcement_link' }, { value: link || '', updatedBy: req.user._id }, { upsert: true }),
      SystemSetting.findOneAndUpdate({ key: 'announcement_dismissable' }, { value: dismissable, updatedBy: req.user._id }, { upsert: true }),
    ];
    await Promise.all(updates);
    await logAction(req.user._id, 'system.announcement.update', { enabled, text: text?.substring(0, 100) });
    res.json({ message: 'Announcement updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- API Health ---
exports.getApiHealth = async (req, res) => {
  try {
    const health = getSystemHealth();
    const perf = getPerformanceStats();

    // Check DB
    let dbStatus = 'connected';
    let dbLatency = 0;
    try {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      dbLatency = Date.now() - start;
    } catch {
      dbStatus = 'disconnected';
    }

    // Check Redis
    const redisUp = isRedisAvailable();

    res.json({
      status: health.status,
      uptime: health.uptime,
      nodeVersion: health.nodeVersion,
      memory: health.memory,
      db: { status: dbStatus, latency: dbLatency, host: mongoose.connection.host },
      redis: { status: redisUp ? 'connected' : 'unavailable' },
      performance: {
        requestsPerMinute: perf.requestsPerMinute,
        avgResponseTime: perf.avgResponseTime,
        errorRate: perf.errorRate,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Background Jobs ---
exports.getJobStatus = async (req, res) => {
  try {
    const stats = queue.getStats();
    res.json({ queues: stats, isRunning: queue.isRunning });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.clearFailedJobs = async (req, res) => {
  try {
    queue.cleanup();
    await logAction(req.user._id, 'system.jobs.cleanup');
    res.json({ message: 'Cleaned up completed/failed jobs' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleQueue = async (req, res) => {
  try {
    if (queue.isRunning) {
      queue.stop();
    } else {
      queue.isRunning = true;
    }
    await logAction(req.user._id, 'system.jobs.toggle', { running: queue.isRunning });
    res.json({ isRunning: queue.isRunning });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Error Logs ---
exports.getErrorLogs = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const errors = ErrorMonitor.getRecentErrors(parseInt(limit));
    const stats = ErrorMonitor.getErrorStats();
    res.json({ errors, stats });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.clearErrors = async (req, res) => {
  try {
    ErrorMonitor.clearOldErrors();
    await logAction(req.user._id, 'system.errors.clear');
    res.json({ message: 'Old errors cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Cache Management ---
exports.getCacheStatus = async (req, res) => {
  try {
    const redisUp = isRedisAvailable();
    res.json({
      redis: { available: redisUp },
      keys: Object.values(CACHE_KEYS),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.flushCache = async (req, res) => {
  try {
    const { pattern } = req.body;
    if (pattern) {
      await cacheDelPattern(pattern);
    } else {
      // Flush all known patterns
      for (const key of Object.values(CACHE_KEYS)) {
        await cacheDelPattern(key + '*');
      }
    }
    await logAction(req.user._id, 'system.cache.flush', { pattern: pattern || 'all' });
    res.json({ message: 'Cache flushed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Database Activity ---
exports.getDbOverview = async (req, res) => {
  try {
    const collections = [
      { name: 'users', model: User },
      { name: 'posts', model: Post },
      { name: 'comments', model: Comment },
      { name: 'messages', model: Message },
      { name: 'notifications', model: Notification },
      { name: 'groups', model: Group },
      { name: 'stories', model: Story },
      { name: 'reels', model: Reel },
      { name: 'listings', model: Listing },
    ];

    const stats = await Promise.all(collections.map(async ({ name, model }) => {
      const count = await model.countDocuments();
      const lastDoc = await model.findOne().sort({ createdAt: -1 }).select('createdAt').lean();
      return {
        name,
        count,
        lastActivity: lastDoc?.createdAt || null,
      };
    }));

    // DB stats
    let dbStats = {};
    try {
      const raw = await mongoose.connection.db.admin().command({ dbStats: 1 });
      dbStats = {
        size: Math.round(raw.dataSize / 1024 / 1024),
        storageSize: Math.round(raw.storageSize / 1024 / 1024),
        indexes: raw.indexes,
        indexSize: Math.round(raw.indexSize / 1024 / 1024),
        collections: raw.collections,
      };
    } catch {}

    // Connection info
    const connState = mongoose.connection.readyState;
    const connStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

    res.json({
      connection: { state: connStates[connState] || 'unknown', host: mongoose.connection.host, name: mongoose.connection.name },
      dbStats,
      collections: stats,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
