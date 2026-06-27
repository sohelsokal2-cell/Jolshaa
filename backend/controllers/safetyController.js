const Report = require('../models/Report');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Story = require('../models/Story');
const Reel = require('../models/Reel');
const Listing = require('../models/Listing');
const ModeratorNote = require('../models/ModeratorNote');
const SpamFlag = require('../models/SpamFlag');
const AdminAction = require('../models/AdminAction');
const AIModeration = require('../services/aiModeration');

const logAction = async (admin, action, targetType, targetId, targetName = '', details = {}) => {
  try {
    await AdminAction.create({ admin, action, targetType, targetId, targetName, details });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

// ============================================================
// ABUSE REPORT DASHBOARD
// ============================================================

exports.getReportDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    const [
      totalReports, pendingReports, escalatedReports,
      resolvedToday, resolvedThisWeek, resolvedThisMonth,
      reportsByReason, reportsByType, reportsByPriority,
      averageResolutionTime, topReportedUsers, recentReports,
    ] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: 'escalated' }),
      Report.countDocuments({ status: 'resolved', resolvedAt: { $gte: today } }),
      Report.countDocuments({ status: 'resolved', resolvedAt: { $gte: sevenDaysAgo } }),
      Report.countDocuments({ status: 'resolved', resolvedAt: { $gte: thirtyDaysAgo } }),
      Report.aggregate([
        { $group: { _id: '$reason', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Report.aggregate([
        { $group: { _id: '$targetType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Report.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Report.aggregate([
        { $match: { status: 'resolved', resolvedAt: { $ne: null }, reviewedAt: { $ne: null } } },
        { $project: { diff: { $subtract: ['$resolvedAt', '$createdAt'] } } },
        { $group: { _id: null, avg: { $avg: '$diff' } } }
      ]),
      User.find({ reportsReceived: { $gte: 3 } })
        .select('name email profilePhoto reportsReceived safetyScore isRepeatOffender isBanned isSuspended')
        .sort({ reportsReceived: -1 })
        .limit(10),
      Report.find()
        .populate('reporter', 'name profilePhoto')
        .populate('assignedTo', 'name')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    const avgHours = averageResolutionTime[0]?.avg
      ? Math.round(averageResolutionTime[0].avg / 3600000)
      : 0;

    res.json({
      totalReports, pendingReports, escalatedReports,
      resolvedToday, resolvedThisWeek, resolvedThisMonth,
      reportsByReason, reportsByType, reportsByPriority,
      averageResolutionHours: avgHours,
      topReportedUsers,
      recentReports,
    });
  } catch (error) {
    console.error('Report dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// ENHANCED REPORT MANAGEMENT
// ============================================================

exports.getReportsEnhanced = async (req, res) => {
  try {
    const { status, priority, reason, assignedTo, escalationLevel, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (reason) query.reason = reason;
    if (assignedTo) query.assignedTo = assignedTo;
    if (escalationLevel) query.escalationLevel = parseInt(escalationLevel);

    const reports = await Report.find(query)
      .populate('reporter', 'name profilePhoto')
      .populate('reviewedBy', 'name')
      .populate('assignedTo', 'name')
      .populate('resolvedBy', 'name')
      .sort({ priority: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);
    res.json({ reports, page: parseInt(page), totalPages: Math.ceil(total / limit), total });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.assignReport = async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    report.assignedTo = assignedTo || req.user._id;
    report.status = report.status === 'pending' ? 'reviewed' : report.status;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    await report.save();

    await logAction(req.user._id, 'report.assign', 'Report', report._id, '', { assignedTo: report.assignedTo });
    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.escalateReport = async (req, res) => {
  try {
    const { reason, toLevel } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const previousLevel = report.escalationLevel;
    const newLevel = toLevel || Math.min(report.escalationLevel + 1, 3);
    report.escalationHistory.push({
      escalatedBy: req.user._id,
      fromLevel: previousLevel,
      toLevel: newLevel,
      reason: reason || ''
    });
    report.escalationLevel = newLevel;
    report.status = 'escalated';
    if (newLevel >= 2) report.priority = 'critical';
    else if (newLevel >= 1) report.priority = 'high';
    await report.save();

    await logAction(req.user._id, 'report.escalate', 'Report', report._id, '', { fromLevel: previousLevel, toLevel: newLevel, reason });
    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resolveReport = async (req, res) => {
  try {
    const { resolution, status } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    report.status = status || 'resolved';
    report.resolution = resolution || 'none';
    report.resolvedBy = req.user._id;
    report.resolvedAt = new Date();
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    await report.save();

    if (resolution && resolution !== 'no_action') {
      await User.findByIdAndUpdate(report.targetId, {
        $inc: { reportsResolved: 1 },
        $set: { lastReportedAt: new Date() }
      });
    }

    await logAction(req.user._id, status === 'dismissed' ? 'report.dismiss' : 'report.resolve', 'Report', report._id, '', { resolution });
    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// SPAM DETECTION QUEUE
// ============================================================

exports.scanForSpam = async (req, res) => {
  try {
    const { contentType } = req.query;
    let items = [];

    if (!contentType || contentType === 'post') {
      const posts = await Post.find({ createdAt: { $gte: new Date(Date.now() - 24 * 3600000) } })
        .populate('author', 'name email reportsReceived')
        .sort({ createdAt: -1 }).limit(100);
      for (const post of posts) {
        const check = AIModeration.checkContent(post.text);
        if (!check.safe) {
          items.push({
            contentType: 'post',
            contentId: post._id,
            contentText: post.text?.substring(0, 200),
            author: post.author,
            score: check.score,
            flags: check.flags,
            action: check.action,
            createdAt: post.createdAt
          });
        }
      }
    }

    if (!contentType || contentType === 'comment') {
      const comments = await Comment.find({ createdAt: { $gte: new Date(Date.now() - 24 * 3600000) } })
        .populate('author', 'name email reportsReceived')
        .sort({ createdAt: -1 }).limit(100);
      for (const comment of comments) {
        const check = AIModeration.checkContent(comment.text);
        if (!check.safe) {
          items.push({
            contentType: 'comment',
            contentId: comment._id,
            contentText: comment.text?.substring(0, 200),
            author: comment.author,
            score: check.score,
            flags: check.flags,
            action: check.action,
            createdAt: comment.createdAt
          });
        }
      }
    }

    items.sort((a, b) => b.score - a.score);

    // Save spam flags
    for (const item of items.filter(i => i.action === 'flag' || i.action === 'reject')) {
      const existing = await SpamFlag.findOne({ contentId: item.contentId, status: 'pending' });
      if (!existing) {
        await SpamFlag.create({
          user: item.author._id,
          contentType: item.contentType,
          contentId: item.contentId,
          contentText: item.contentText,
          spamType: 'auto_detected',
          confidence: item.score,
          flags: item.flags.map(f => ({ type: f.type, severity: f.severity, detail: f.word || f.pattern || '' })),
          status: 'pending'
        });
      }
    }

    res.json({ items, total: items.length });
  } catch (error) {
    console.error('Spam scan error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSpamQueue = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    else query.status = 'pending';

    const flags = await SpamFlag.find(query)
      .populate('user', 'name email profilePhoto')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await SpamFlag.countDocuments(query);
    res.json({ flags, page: parseInt(page), totalPages: Math.ceil(total / limit), total });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.reviewSpamFlag = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const flag = await SpamFlag.findById(req.params.id);
    if (!flag) return res.status(404).json({ message: 'Spam flag not found' });

    flag.status = status;
    flag.reviewedBy = req.user._id;
    flag.reviewedAt = new Date();
    await flag.save();

    if (status === 'confirmed') {
      await User.findByIdAndUpdate(flag.user, {
        $inc: { reportsReceived: 1 },
        lastReportedAt: new Date()
      });
      const user = await User.findById(flag.user);
      if (user && user.reportsReceived >= 3) {
        user.isRepeatOffender = true;
        user.safetyScore = Math.max(0, user.safetyScore - 10);
        await user.save();
      }
    }

    await logAction(req.user._id, 'safety.spam_flag', 'User', flag.user, '', { status, contentType: flag.contentType });
    res.json({ flag });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// HARASSMENT / HATE / FAKE ACCOUNT FLAGS
// ============================================================

exports.getFlagsByReason = async (req, res) => {
  try {
    const { reason, page = 1, limit = 20 } = req.query;
    const query = {};
    if (reason) query.reason = reason;
    else query.reason = { $in: ['harassment', 'hate_speech', 'fake_account'] };

    const reports = await Report.find(query)
      .populate('reporter', 'name profilePhoto')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);
    res.json({ reports, page: parseInt(page), totalPages: Math.ceil(total / limit), total });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// BLOCKED USERS OVERVIEW
// ============================================================

exports.getBlockedUsersOverview = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const users = await User.find({
      $or: [{ isBanned: true }, { isSuspended: true }]
    })
      .select('name email profilePhoto isBanned isSuspended bannedAt bannedReason suspendedAt suspendedReason reportsReceived safetyScore isRepeatOffender warnings restrictions createdAt')
      .sort({ reportsReceived: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments({
      $or: [{ isBanned: true }, { isSuspended: true }]
    });

    const blockedByUser = await User.aggregate([
      { $project: { name: 1, blockedCount: { $size: { $ifNull: ['$blockedUsers', []] } } } },
      { $match: { blockedCount: { $gt: 0 } } },
      { $sort: { blockedCount: -1 } },
      { $limit: 10 }
    ]);

    res.json({ users, blockedByUser, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// REPEAT OFFENDER TRACKING
// ============================================================

exports.getRepeatOffenders = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const users = await User.find({
      $or: [
        { isRepeatOffender: true },
        { reportsReceived: { $gte: 3 } }
      ]
    })
      .select('name email profilePhoto isBanned isSuspended reportsReceived reportsResolved safetyScore isRepeatOffender warnings restrictions lastReportedAt createdAt')
      .sort({ reportsReceived: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments({
      $or: [
        { isRepeatOffender: true },
        { reportsReceived: { $gte: 3 } }
      ]
    });

    res.json({ users, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.flagRepeatOffender = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isRepeatOffender = true;
    user.safetyScore = Math.max(0, user.safetyScore - 20);
    await user.save();

    await logAction(req.user._id, 'safety.offender_flag', 'User', user._id, user.name, { reportsReceived: user.reportsReceived });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.clearRepeatOffender = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isRepeatOffender = false;
    user.safetyScore = Math.min(100, user.safetyScore + 20);
    await user.save();

    await logAction(req.user._id, 'safety.offender_clear', 'User', user._id, user.name);
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateSafetyScore = async (req, res) => {
  try {
    const { score } = req.body;
    if (score === undefined || score < 0 || score > 100) {
      return res.status(400).json({ message: 'Score must be between 0 and 100' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.safetyScore = score;
    await user.save();

    await logAction(req.user._id, 'safety.score_update', 'User', user._id, user.name, { score });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// SAFETY AUDIT LOGS
// ============================================================

exports.getSafetyAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 30, action, startDate, endDate } = req.query;
    const query = {};
    if (action) query.action = action;
    else query.action = { $regex: '^(report\.|safety\.)' };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await AdminAction.find(query)
      .populate('admin', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await AdminAction.countDocuments(query);
    res.json({ logs, page: parseInt(page), totalPages: Math.ceil(total / limit), total });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// MODERATOR NOTES & CASE HISTORY
// ============================================================

exports.addModeratorNote = async (req, res) => {
  try {
    const { reportId, targetType, targetId, note, tags } = req.body;
    if (!note) return res.status(400).json({ message: 'Note text is required' });

    const noteData = {
      report: reportId || null,
      targetType: targetType || 'report',
      targetId: targetId || reportId,
      author: req.user._id,
      note,
      tags: tags || []
    };

    const moderatorNote = await ModeratorNote.create(noteData);

    if (reportId) {
      await logAction(req.user._id, 'safety.note_add', 'Report', reportId, '', { notePreview: note.substring(0, 100) });
    }

    res.status(201).json({ moderatorNote });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCaseHistory = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;

    const [reports, notes] = await Promise.all([
      Report.find({ targetType, targetId })
        .populate('reporter', 'name profilePhoto')
        .populate('reviewedBy', 'name')
        .populate('assignedTo', 'name')
        .sort({ createdAt: -1 }),
      ModeratorNote.find({ targetType, targetId })
        .populate('author', 'name profilePhoto')
        .sort({ createdAt: -1 })
    ]);

    res.json({ reports, notes });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserCaseHistory = async (req, res) => {
  try {
    const userId = req.params.id;

    const [user, reportsAgainst, reportsBy, notes, spamFlags] = await Promise.all([
      User.findById(userId).select('name email profilePhoto isBanned isSuspended reportsReceived safetyScore isRepeatOffender warnings restrictions createdAt'),
      Report.find({ targetType: 'user', targetId: userId })
        .populate('reporter', 'name profilePhoto')
        .sort({ createdAt: -1 }),
      Report.find({ reporter: userId })
        .sort({ createdAt: -1 })
        .limit(20),
      ModeratorNote.find({ $or: [{ targetType: 'user', targetId: userId }, { report: { $in: (await Report.find({ targetType: 'user', targetId: userId })).map(r => r._id) } }] })
        .populate('author', 'name profilePhoto')
        .sort({ createdAt: -1 }),
      SpamFlag.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(20)
    ]);

    res.json({ user, reportsAgainst, reportsBy, notes, spamFlags });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// ESCALATION WORKFLOW
// ============================================================

exports.getEscalatedReports = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const reports = await Report.find({ status: 'escalated' })
      .populate('reporter', 'name profilePhoto')
      .populate('assignedTo', 'name')
      .populate('reviewedBy', 'name')
      .sort({ escalationLevel: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Report.countDocuments({ status: 'escalated' });
    res.json({ reports, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.autoEscalateReports = async () => {
  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000);
    const pendingOld = await Report.find({
      status: 'pending',
      createdAt: { $lte: threeDaysAgo },
      escalationLevel: { $lt: 2 }
    });

    for (const report of pendingOld) {
      const newLevel = Math.min(report.escalationLevel + 1, 2);
      report.escalationHistory.push({
        escalatedBy: null,
        fromLevel: report.escalationLevel,
        toLevel: newLevel,
        reason: 'Auto-escalated: pending for 3+ days'
      });
      report.escalationLevel = newLevel;
      report.status = 'escalated';
      if (newLevel >= 2) report.priority = 'critical';
      else if (newLevel >= 1) report.priority = 'high';
      await report.save();
    }

    return pendingOld.length;
  } catch (error) {
    console.error('Auto-escalation error:', error);
    return 0;
  }
};
