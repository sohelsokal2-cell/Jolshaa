const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { ErrorMonitor } = require('../services/errorMonitor');
const { getPerformanceStats, getSystemHealth } = require('../services/performanceMonitor');
const { AuditService } = require('../services/auditLog');
const { cacheGet, cacheSet, cacheDelPattern, isRedisAvailable } = require('../services/cache');
const { queue } = require('../services/queue');
const BackupService = require('../services/backup');
const DataRetention = require('../services/dataRetention');

router.use(protect);
router.use(adminOnly);

router.get('/health', (req, res) => {
  res.json(getSystemHealth());
});

router.get('/performance', (req, res) => {
  res.json(getPerformanceStats());
});

router.get('/errors', (req, res) => {
  res.json({
    errors: ErrorMonitor.getRecentErrors(50),
    stats: ErrorMonitor.getErrorStats(),
  });
});

router.get('/audit-logs', async (req, res) => {
  const logs = await AuditService.getLogs({
    action: req.query.action,
    user: req.query.user,
    limit: parseInt(req.query.limit) || 100,
  });
  res.json({ logs });
});

router.get('/audit-stats', async (req, res) => {
  const stats = await AuditService.getStats(parseInt(req.query.days) || 7);
  res.json({ stats });
});

router.get('/queue-stats', (req, res) => {
  res.json(queue.getStats());
});

router.get('/cache/stats', (req, res) => {
  res.json({ redisAvailable: isRedisAvailable() });
});

router.post('/cache/clear', async (req, res) => {
  await cacheDelPattern(req.body.pattern || '*');
  res.json({ message: 'Cache cleared' });
});

router.post('/backup', async (req, res) => {
  const result = await BackupService.createBackup(req.body.type || 'full');
  res.json(result);
});

router.get('/backups', (req, res) => {
  res.json({ backups: BackupService.listBackups() });
});

router.post('/restore', async (req, res) => {
  const result = await BackupService.restoreBackup(req.body.filepath);
  res.json(result);
});

router.post('/retention/run', async (req, res) => {
  const results = await DataRetention.runAllPolicies();
  res.json({ results });
});

router.get('/retention/policies', (req, res) => {
  res.json(DataRetention.Policies);
});

module.exports = router;
