const User = require('../models/User');
const Post = require('../models/Post');
const Report = require('../models/Report');
const Comment = require('../models/Comment');
const Reaction = require('../models/Reaction');
const Notification = require('../models/Notification');
const Story = require('../models/Story');
const Group = require('../models/Group');
const Page = require('../models/Page');
const Appeal = require('../models/Appeal');
const AdminAction = require('../models/AdminAction');

const logAction = async (admin, action, targetType, targetId, targetName = '', details = {}) => {
  try {
    await AdminAction.create({ admin, action, targetType, targetId, targetName, details });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

// --- User Management ---

exports.getUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 20, status, role } = req.query;
    const query = {};

    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
      ];
    }
    if (status === 'suspended') query.isSuspended = true;
    else if (status === 'banned') query.isBanned = true;
    else if (status === 'verified') query.isVerified = true;
    if (role) query.role = role;

    const users = await User.find(query)
      .select('name email profilePhoto isAdmin role isSuspended isBanned isVerified isCreator createdAt warnings')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({ users, page: parseInt(page), totalPages: Math.ceil(total / limit), total });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -loginHistory -sessions');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const [postCount, friendCount, reportCount] = await Promise.all([
      Post.countDocuments({ author: user._id }),
      User.countDocuments({ friends: user._id }),
      Report.countDocuments({ targetType: 'user', targetId: user._id }),
    ]);

    res.json({ user, postCount, friendCount, reportCount });
  } catch (error) {
    console.error('Admin get user details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Ban / Unban ---

exports.banUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isAdmin) return res.status(400).json({ message: 'Cannot ban an admin' });

    user.isBanned = !user.isBanned;
    user.bannedAt = user.isBanned ? new Date() : null;
    user.bannedReason = user.isBanned ? (reason || '') : '';
    if (user.isBanned) {
      user.isSuspended = false;
      user.suspendedAt = null;
      user.suspendedReason = '';
    }
    await user.save();

    await logAction(req.user._id, user.isBanned ? 'user.ban' : 'user.unban', 'User', user._id, user.name, { reason });

    res.json({
      message: user.isBanned ? 'User banned' : 'User unbanned',
      user: { _id: user._id, name: user.name, isBanned: user.isBanned, bannedAt: user.bannedAt, bannedReason: user.bannedReason },
    });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Suspend / Unsuspend ---

exports.suspendUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isAdmin) return res.status(400).json({ message: 'Cannot suspend an admin' });

    user.isSuspended = !user.isSuspended;
    user.suspendedAt = user.isSuspended ? new Date() : null;
    user.suspendedReason = user.isSuspended ? (reason || '') : '';
    await user.save();

    await logAction(req.user._id, user.isSuspended ? 'user.suspend' : 'user.unsuspend', 'User', user._id, user.name, { reason });

    res.json({
      message: user.isSuspended ? 'User suspended' : 'User unsuspended',
      user: { _id: user._id, name: user.name, isSuspended: user.isSuspended, suspendedAt: user.suspendedAt, suspendedReason: user.suspendedReason },
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Warn ---

exports.warnUser = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Warning message is required' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isAdmin) return res.status(400).json({ message: 'Cannot warn an admin' });

    user.warnings.push({ message, issuedBy: req.user._id });
    await user.save();

    // Notify user of warning
    try {
      const Notification = require('../models/Notification');
      const { getIO } = require('../socket');
      const notification = await Notification.create({
        recipient: user._id,
        sender: req.user._id,
        type: 'tag',
      });
      getIO().to(`user:${user._id}`).emit('newNotification', {
        ...notification.toObject(),
        sender: { _id: req.user._id, name: req.user.name, profilePhoto: req.user.profilePhoto },
        message: `You have been warned: ${message}`,
      });
    } catch (err) {
      console.error('Warning notification failed:', err.message);
    }

    await logAction(req.user._id, 'user.warn', 'User', user._id, user.name, { message });

    res.json({ message: 'User warned', warnings: user.warnings });
  } catch (error) {
    console.error('Warn user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getWarnings = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('warnings')
      .populate('warnings.issuedBy', 'name');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ warnings: user.warnings });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeWarning = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.warnings = user.warnings.filter(w => w._id.toString() !== req.params.warningId);
    await user.save();

    res.json({ message: 'Warning removed', warnings: user.warnings });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Restrict ---

exports.restrictUser = async (req, res) => {
  try {
    const { type, durationDays } = req.body;
    if (!type) return res.status(400).json({ message: 'Restriction type is required' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isAdmin) return res.status(400).json({ message: 'Cannot restrict an admin' });

    const expiresAt = durationDays ? new Date(Date.now() + durationDays * 86400000) : null;
    user.restrictions.push({ type, expiresAt, issuedBy: req.user._id });
    await user.save();

    // Notify user of restriction
    try {
      const Notification = require('../models/Notification');
      const { getIO } = require('../socket');
      const typeLabels = { post: 'posting', comment: 'commenting', message: 'messaging', friend_request: 'sending friend requests', group_join: 'joining groups' };
      const label = typeLabels[type] || type;
      const duration = durationDays ? ` for ${durationDays} days` : ' permanently';
      const notification = await Notification.create({
        recipient: user._id,
        sender: req.user._id,
        type: 'tag',
      });
      getIO().to(`user:${user._id}`).emit('newNotification', {
        ...notification.toObject(),
        sender: { _id: req.user._id, name: req.user.name, profilePhoto: req.user.profilePhoto },
        message: `You have been restricted from ${label}${duration}`,
      });
    } catch (err) {
      console.error('Restriction notification failed:', err.message);
    }

    await logAction(req.user._id, 'user.restrict', 'User', user._id, user.name, { type, durationDays });

    res.json({ message: 'User restricted', restrictions: user.restrictions });
  } catch (error) {
    console.error('Restrict user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeRestriction = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.restrictions = user.restrictions.filter(r => r._id.toString() !== req.params.restrictionId);
    await user.save();

    await logAction(req.user._id, 'user.restriction_remove', 'User', user._id, user.name, {});

    res.json({ message: 'Restriction removed', restrictions: user.restrictions });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Verify / Unverify ---

exports.verifyUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isVerified = !user.isVerified;
    user.verificationRequested = false;
    user.verificationReason = '';
    await user.save();

    await logAction(req.user._id, user.isVerified ? 'user.verify' : 'user.unverify', 'User', user._id, user.name);

    res.json({ message: user.isVerified ? 'User verified' : 'User unverified', isVerified: user.isVerified });
  } catch (error) {
    console.error('verifyUser error:', error.message, error.errors);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.requestVerification = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.user._id);
    user.verificationRequested = true;
    user.verificationReason = reason || '';
    await user.save();
    res.json({ message: 'Verification request submitted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getVerificationRequests = async (req, res) => {
  try {
    const users = await User.find({ verificationRequested: true })
      .select('name email profilePhoto isVerified verificationReason createdAt')
      .sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Role Management ---

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const oldRole = user.role;
    user.role = role;
    user.isAdmin = role === 'admin' || role === 'superadmin';
    await user.save();

    await logAction(req.user._id, 'user.role_change', 'User', user._id, user.name, { from: oldRole, to: role });

    res.json({ message: 'Role updated', role: user.role, isAdmin: user.isAdmin });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: { $in: ['admin', 'superadmin', 'moderator'] } })
      .select('name email profilePhoto role isAdmin createdAt')
      .sort({ createdAt: -1 });
    res.json({ admins });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Delete User ---

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isAdmin) return res.status(400).json({ message: 'Cannot delete an admin' });

    await logAction(req.user._id, 'user.delete', 'User', user._id, user.name);

    await Post.deleteMany({ author: user._id });
    await Comment.deleteMany({ author: user._id });
    await Reaction.deleteMany({ user: user._id });
    await Notification.deleteMany({ $or: [{ recipient: user._id }, { sender: user._id }] });
    await Story.deleteMany({ author: user._id });
    await Report.deleteMany({ reporter: user._id });
    await user.deleteOne();

    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Content Removal ---

exports.removePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    await logAction(req.user._id, 'content.remove_post', 'Post', post._id, post.text?.substring(0, 50));

    await Post.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ post: req.params.id });
    await Reaction.deleteMany({ targetType: 'Post', targetId: req.params.id });
    await Report.deleteMany({ targetType: 'post', targetId: req.params.id });

    res.json({ message: 'Post removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    await logAction(req.user._id, 'content.remove_comment', 'Comment', comment._id, comment.text?.substring(0, 50));

    await Comment.deleteMany({ parentComment: req.params.id });
    await Comment.findByIdAndDelete(req.params.id);
    await Reaction.deleteMany({ targetType: 'Comment', targetId: req.params.id });
    await Report.deleteMany({ targetType: 'comment', targetId: req.params.id });

    res.json({ message: 'Comment removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    await logAction(req.user._id, 'content.remove_story', 'Story', story._id);

    await story.deleteOne();
    await Report.deleteMany({ targetType: 'story', targetId: req.params.id });

    res.json({ message: 'Story removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Reports ---

exports.getReports = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const reports = await Report.find(query)
      .populate('reporter', 'name profilePhoto')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    res.json({ reports, page: parseInt(page), totalPages: Math.ceil(total / limit), total });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['reviewed', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    report.status = status;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    await report.save();

    await logAction(req.user._id, status === 'resolved' ? 'report.resolve' : 'report.dismiss', 'Report', report._id);

    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Appeals ---

exports.getAppeals = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const appeals = await Appeal.find(query)
      .populate('user', 'name email profilePhoto')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Appeal.countDocuments(query);

    res.json({ appeals, page: parseInt(page), totalPages: Math.ceil(total / limit), total });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.handleAppeal = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const appeal = await Appeal.findById(req.params.id);
    if (!appeal) return res.status(404).json({ message: 'Appeal not found' });

    appeal.status = status;
    appeal.adminNote = adminNote || '';
    appeal.reviewedBy = req.user._id;
    appeal.reviewedAt = new Date();
    await appeal.save();

    if (status === 'accepted') {
      const user = await User.findById(appeal.user);
      if (user) {
        if (appeal.type === 'ban') {
          user.isBanned = false;
          user.bannedAt = null;
          user.bannedReason = '';
        } else if (appeal.type === 'suspend') {
          user.isSuspended = false;
          user.suspendedAt = null;
          user.suspendedReason = '';
        } else if (appeal.type === 'warning') {
          user.warnings = user.warnings.filter(w => w._id.toString() !== appeal.targetId?.toString());
        } else if (appeal.type === 'verification') {
          user.isVerified = true;
          user.verificationRequested = false;
        }
        await user.save();
      }
    }

    // Notify user of appeal decision
    try {
      const Notification = require('../models/Notification');
      const { getIO } = require('../socket');
      const typeLabels = { ban: 'Ban', suspend: 'Suspension', warning: 'Warning', restriction: 'Restriction', verification: 'Verification' };
      const label = typeLabels[appeal.type] || appeal.type;
      const notification = await Notification.create({
        recipient: appeal.user,
        sender: req.user._id,
        type: 'tag',
      });
      getIO().to(`user:${appeal.user}`).emit('newNotification', {
        ...notification.toObject(),
        sender: { _id: req.user._id, name: req.user.name, profilePhoto: req.user.profilePhoto },
        message: status === 'accepted'
          ? `Your ${label} appeal has been accepted${adminNote ? ': ' + adminNote : ''}`
          : `Your ${label} appeal has been rejected${adminNote ? ': ' + adminNote : ''}`,
      });
    } catch (err) {
      console.error('Appeal notification failed:', err.message);
    }

    await logAction(req.user._id, status === 'accepted' ? 'appeal.accept' : 'appeal.reject', 'Appeal', appeal._id, '', { type: appeal.type, userId: appeal.user });

    res.json({ appeal });
  } catch (error) {
    console.error('Handle appeal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Audit Log ---

exports.getAuditLog = async (req, res) => {
  try {
    const { page = 1, limit = 30, action } = req.query;
    const query = {};
    if (action) query.action = action;

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

// --- Stats ---

exports.getStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers, totalPosts, totalGroups, totalPages,
      activeToday, pendingReports, suspendedUsers, bannedUsers,
      verifiedUsers, pendingAppeals, pendingVerifications, totalAdminActions,
    ] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Group.countDocuments(),
      Page.countDocuments(),
      User.countDocuments({ createdAt: { $gte: today } }),
      Report.countDocuments({ status: 'pending' }),
      User.countDocuments({ isSuspended: true }),
      User.countDocuments({ isBanned: true }),
      User.countDocuments({ isVerified: true }),
      Appeal.countDocuments({ status: 'pending' }),
      User.countDocuments({ verificationRequested: true }),
      AdminAction.countDocuments(),
    ]);

    const recentActions = await AdminAction.find()
      .populate('admin', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      totalUsers, totalPosts, totalGroups, totalPages,
      activeToday, pendingReports, suspendedUsers, bannedUsers,
      verifiedUsers, pendingAppeals, pendingVerifications, totalAdminActions,
      recentActions,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
