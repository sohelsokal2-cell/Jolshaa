const User = require('../models/User');
const AdminAction = require('../models/AdminAction');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

const logAction = async (admin, action, details = {}) => {
  try {
    await AdminAction.create({ admin, action, targetType: 'Security', targetId: null, targetName: 'security', details });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

// --- Admin Login Audit ---
exports.getAdminLoginAudit = async (req, res) => {
  try {
    const { userId, limit = 50 } = req.query;

    let query = { isAdmin: true };
    if (userId) query._id = userId;

    const admins = await User.find(query)
      .select('name email role loginHistory')
      .lean();

    const auditEntries = [];
    for (const admin of admins) {
      for (const entry of (admin.loginHistory || [])) {
        auditEntries.push({
          ...entry,
          adminId: admin._id,
          adminName: admin.name,
          adminEmail: admin.email,
          adminRole: admin.role,
        });
      }
    }

    auditEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      entries: auditEntries.slice(0, parseInt(limit)),
      total: auditEntries.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Suspicious Login Detection ---
exports.getSuspiciousLogins = async (req, res) => {
  try {
    const admins = await User.find({ isAdmin: true })
      .select('name email role loginHistory')
      .lean();

    const suspicious = [];

    for (const admin of admins) {
      const history = admin.loginHistory || [];
      const failedLogins = history.filter(h => !h.success);
      const uniqueIPs = [...new Set(history.map(h => h.ip).filter(Boolean))];
      const uniqueUserAgents = [...new Set(history.map(h => h.userAgent).filter(Boolean))];

      // Detect suspicious patterns
      const recentFailed = failedLogins.filter(h => {
        const age = Date.now() - new Date(h.timestamp).getTime();
        return age < 24 * 60 * 60 * 1000;
      });

      const multipleIPs = uniqueIPs.length > 3;
      const manyFailedAttempts = recentFailed.length >= 3;
      const shortTimeBurst = (() => {
        const recent = history.filter(h => {
          const age = Date.now() - new Date(h.timestamp).getTime();
          return age < 60 * 60 * 1000;
        });
        const ips = [...new Set(recent.map(h => h.ip).filter(Boolean))];
        return ips.length > 2;
      })();

      if (recentFailed.length > 0 || multipleIPs || manyFailedAttempts || shortTimeBurst) {
        const riskScore = Math.min(100,
          (recentFailed.length * 10) +
          (uniqueIPs.length > 3 ? 20 : 0) +
          (shortTimeBurst ? 30 : 0) +
          (manyFailedAttempts ? 25 : 0)
        );

        suspicious.push({
          adminId: admin._id,
          adminName: admin.name,
          adminEmail: admin.email,
          adminRole: admin.role,
          riskScore,
          reasons: {
            recentFailedAttempts: recentFailed.length,
            uniqueIPs: uniqueIPs.length,
            uniqueUserAgents: uniqueUserAgents.length,
            multipleIPs,
            shortTimeBurst,
          },
          recentLogins: history.slice(0, 10),
        });
      }
    }

    suspicious.sort((a, b) => b.riskScore - a.riskScore);

    res.json({ suspicious, total: suspicious.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- All Admin Sessions ---
exports.getAdminSessions = async (req, res) => {
  try {
    const admins = await User.find({ isAdmin: true })
      .select('name email role sessions')
      .lean();

    const allSessions = [];
    for (const admin of admins) {
      for (const session of (admin.sessions || [])) {
        allSessions.push({
          _id: session._id,
          ip: session.ip,
          userAgent: session.userAgent,
          lastActive: session.lastActive,
          createdAt: session.createdAt,
          // token intentionally excluded
          adminId: admin._id,
          adminName: admin.name,
          adminEmail: admin.email,
          adminRole: admin.role,
        });
      }
    }

    allSessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ sessions: allSessions, total: allSessions.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Revoke Admin Session ---
exports.revokeAdminSession = async (req, res) => {
  try {
    const { userId, sessionId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.sessions = user.sessions.filter(s => s._id.toString() !== sessionId);
    await user.save();

    await logAction(req.user._id, 'security.session.revoke', {
      targetUser: user.name,
      sessionId,
    });

    res.json({ message: 'Session revoked' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Revoke All Admin Sessions ---
exports.revokeAllAdminSessions = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const count = user.sessions.length;
    user.sessions = [];
    await user.save();

    await logAction(req.user._id, 'security.session.revoke_all', {
      targetUser: user.name,
      sessionsRevoked: count,
    });

    res.json({ message: `Revoked ${count} sessions` });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- 2FA Status (admin self) ---
exports.get2FAStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('twoFactorEnabled +twoFactorBackupCodes')
      .lean();

    res.json({
      enabled: user.twoFactorEnabled || false,
      backupCodesCount: (user.twoFactorBackupCodes || []).length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Enable 2FA (step 1: generate secret + QR, not yet active) ---
exports.enable2FA = async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `Jolshaa (${req.user.email})`,
      length: 20,
    });
    const backupCodes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    await User.findByIdAndUpdate(req.user._id, {
      twoFactorSecret: secret.base32,
      twoFactorBackupCodes: backupCodes,
      twoFactorEnabled: false,
    });

    const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url);

    await logAction(req.user._id, 'security.2fa.setup');

    res.json({
      secret: secret.base32,
      qrCode: qrDataUrl,
      backupCodes,
      message: 'Scan the QR code or enter the secret in your authenticator app, then verify with a code to activate',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Verify & Activate 2FA (step 2) ---
exports.verify2FA = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Code is required' });

    const user = await User.findById(req.user._id).select('+twoFactorSecret +twoFactorBackupCodes');

    if (!user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA not set up' });
    }

    const isValidTotp = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });
    const isBackupCode = user.twoFactorBackupCodes.includes(code.toUpperCase());

    if (isValidTotp || isBackupCode) {
      await User.findByIdAndUpdate(req.user._id, {
        twoFactorEnabled: true,
        ...(isBackupCode ? {
          twoFactorBackupCodes: user.twoFactorBackupCodes.filter(c => c !== code.toUpperCase()),
        } : {}),
      });

      await logAction(req.user._id, 'security.2fa.enable');
      res.json({ message: '2FA enabled successfully' });
    } else {
      res.status(400).json({ message: 'Invalid code' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Disable 2FA ---
exports.disable2FA = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      twoFactorEnabled: false,
      twoFactorSecret: undefined,
      twoFactorBackupCodes: [],
    });

    await logAction(req.user._id, 'security.2fa.disable');
    res.json({ message: '2FA disabled' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- 2FA Enforcement for All Admins ---
exports.get2FAEnforcement = async (req, res) => {
  try {
    const admins = await User.find({ isAdmin: true })
      .select('name email role twoFactorEnabled')
      .lean();

    const enforced = admins.every(a => a.twoFactorEnabled);
    const enabledCount = admins.filter(a => a.twoFactorEnabled).length;

    res.json({
      enforced,
      totalAdmins: admins.length,
      enabledCount,
      admins: admins.map(a => ({
        id: a._id,
        name: a.name,
        email: a.email,
        role: a.role,
        twoFactorEnabled: a.twoFactorEnabled || false,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- IP / Device History ---
exports.getIPDeviceHistory = async (req, res) => {
  try {
    const { userId, limit = 100 } = req.query;
    const safeLimit = Math.min(parseInt(limit) || 100, 500);

    // Require userId — returning all users' history is a data leak
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const user = await User.findById(userId)
      .select('name email role loginHistory sessions')
      .lean();

    if (!user) return res.status(404).json({ message: 'User not found' });

    const history = [];
    for (const entry of (user.loginHistory || [])) {
      history.push({ ...entry, userId: user._id, userName: user.name, userEmail: user.email, userRole: user.role, type: 'login' });
    }
    for (const session of (user.sessions || [])) {
      history.push({
        ip: session.ip,
        userAgent: session.userAgent,
        timestamp: session.createdAt,
        lastActive: session.lastActive,
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        type: 'session',
      });
    }

    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const ipSummary = {};
    for (const entry of history) {
      if (!entry.ip) continue;
      if (!ipSummary[entry.ip]) ipSummary[entry.ip] = { ip: entry.ip, count: 0, lastSeen: null };
      ipSummary[entry.ip].count++;
      if (!ipSummary[entry.ip].lastSeen || new Date(entry.timestamp) > new Date(ipSummary[entry.ip].lastSeen)) {
        ipSummary[entry.ip].lastSeen = entry.timestamp;
      }
    }

    res.json({
      history: history.slice(0, safeLimit),
      total: history.length,
      ipSummary: Object.values(ipSummary).sort((a, b) => b.count - a.count),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Permission Change Log ---
exports.getPermissionChangeLog = async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const permissionActions = [
      'user.role_change', 'user.verify', 'user.unverify',
      'user.ban', 'user.unban', 'user.suspend', 'user.unsuspend',
      'user.restrict', 'security.session.revoke', 'security.session.revoke_all',
      'security.2fa.enable', 'security.2fa.disable',
      'system.setting.update', 'system.settings.bulk_update',
      'system.feature.toggle', 'system.maintenance.toggle',
    ];

    const logs = await AdminAction.find({
      action: { $in: permissionActions },
    })
      .populate('admin', 'name email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({ logs, total: logs.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Admin Password Reset ---
exports.adminResetPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword, confirmReset } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Require explicit confirmation
    if (confirmReset !== true) {
      return res.status(400).json({ message: 'Must set confirmReset: true to reset password' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = newPassword;
    user.sessions = [];
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    await logAction(req.user._id, 'security.password.admin_reset', {
      targetUser: user.name,
      targetEmail: user.email,
    });

    res.json({ message: `Password reset for ${user.name}. All sessions revoked.` });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Rate-Limit Abuse Review ---
exports.getRateLimitAbuse = async (req, res) => {
  try {
    const admins = await User.find({ isAdmin: true })
      .select('name email role loginHistory')
      .lean();

    const abuseReport = [];

    for (const admin of admins) {
      const history = admin.loginHistory || [];
      const failedLogins = history.filter(h => !h.success);

      // Check for brute force patterns
      const last24h = failedLogins.filter(h => {
        const age = Date.now() - new Date(h.timestamp).getTime();
        return age < 24 * 60 * 60 * 1000;
      });

      const lastHour = failedLogins.filter(h => {
        const age = Date.now() - new Date(h.timestamp).getTime();
        return age < 60 * 60 * 1000;
      });

      const uniqueAttackerIPs = [...new Set(last24h.map(h => h.ip).filter(Boolean))];

      if (failedLogins.length > 0) {
        abuseReport.push({
          adminId: admin._id,
          adminName: admin.name,
          adminEmail: admin.email,
          adminRole: admin.role,
          totalFailed: failedLogins.length,
          failedLast24h: last24h.length,
          failedLastHour: lastHour.length,
          uniqueAttackerIPs: uniqueAttackerIPs.length,
          attackerIPs: uniqueAttackerIPs,
          lastFailed: failedLogins[0]?.timestamp,
          riskLevel: last24h.length >= 10 ? 'high' : last24h.length >= 3 ? 'medium' : 'low',
        });
      }
    }

    abuseReport.sort((a, b) => b.failedLast24h - a.failedLast24h);

    res.json({ abuseReport, total: abuseReport.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Data Export Restrictions ---
exports.getDataExportRestrictions = async (req, res) => {
  try {
    const Post = require('../models/Post');
    const Message = require('../models/Message');
    const Comment = require('../models/Comment');

    const users = await User.find({})
      .select('name email role createdAt isAdmin')
      .lean();

    const userIds = users.map(u => u._id);

    const [postCounts, messageCounts, commentCounts] = await Promise.all([
      Post.aggregate([{ $match: { author: { $in: userIds } } }, { $group: { _id: '$author', count: { $sum: 1 } } }]),
      Message.aggregate([{ $match: { sender: { $in: userIds } } }, { $group: { _id: '$sender', count: { $sum: 1 } } }]),
      Comment.aggregate([{ $match: { author: { $in: userIds } } }, { $group: { _id: '$author', count: { $sum: 1 } } }]),
    ]);

    const postMap = Object.fromEntries(postCounts.map(p => [p._id.toString(), p.count]));
    const msgMap = Object.fromEntries(messageCounts.map(m => [m._id.toString(), m.count]));
    const cmtMap = Object.fromEntries(commentCounts.map(c => [c._id.toString(), c.count]));

    const restrictions = users.map(user => {
      const uid = user._id.toString();
      const pc = postMap[uid] || 0;
      const mc = msgMap[uid] || 0;
      const cc = cmtMap[uid] || 0;
      return {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        joinedAt: user.createdAt,
        postCount: pc,
        messageCount: mc,
        commentCount: cc,
        estimatedSizeMB: Math.round((pc * 2 + mc + cc * 0.5) * 100) / 100,
        canExport: !user.isAdmin || req.user.role === 'superadmin',
      };
    });

    res.json({ restrictions, total: restrictions.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Export User Data ---
const buildUserExport = async (userId) => {
  const Post = require('../models/Post');
  const Message = require('../models/Message');
  const Comment = require('../models/Comment');

  const user = await User.findById(userId).lean();
  if (!user) return null;

  const [posts, messages, comments] = await Promise.all([
    Post.find({ author: userId }).lean(),
    Message.find({ sender: userId }).lean(),
    Comment.find({ author: userId }).lean(),
  ]);

  return {
    user,
    exportData: {
      profile: {
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        bio: user.bio,
        location: user.location,
      },
      posts: posts.map(p => ({
        text: p.text,
        visibility: p.visibility,
        createdAt: p.createdAt,
      })),
      messages: messages.map(m => ({
        text: m.text,
        conversation: m.conversation,
        createdAt: m.createdAt,
      })),
      comments: comments.map(c => ({
        text: c.text,
        post: c.post,
        createdAt: c.createdAt,
      })),
      exportedAt: new Date().toISOString(),
    },
    counts: { posts: posts.length, messages: messages.length, comments: comments.length },
  };
};

exports.exportUserData = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await buildUserExport(userId);
    if (!result) return res.status(404).json({ message: 'User not found' });
    const { user, exportData, counts } = result;

    await logAction(req.user._id, 'security.data_export', {
      targetUser: user.name,
      targetEmail: user.email,
      postsExported: counts.posts,
      messagesExported: counts.messages,
      commentsExported: counts.comments,
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${user.name.replace(/\s+/g, '_')}_export.json"`);
    res.json(exportData);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Self-service export for regular users (no admin action, no target-user log)
exports.exportMyData = async (req, res) => {
  try {
    const result = await buildUserExport(req.user._id);
    if (!result) return res.status(404).json({ message: 'User not found' });
    const { user, exportData } = result;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${user.name.replace(/\s+/g, '_')}_export.json"`);
    res.json(exportData);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
