const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Story = require('../models/Story');
const Reel = require('../models/Reel');
const Listing = require('../models/Listing');
const Report = require('../models/Report');
const Appeal = require('../models/Appeal');
const AdminAction = require('../models/AdminAction');
const ModeratorNote = require('../models/ModeratorNote');
const UndoSnapshot = require('../models/UndoSnapshot');
const Notification = require('../models/Notification');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ========== GLOBAL SEARCH ==========

exports.globalSearch = async (req, res) => {
  try {
    const { q, type = 'all', page = 1, limit = 20 } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const regex = new RegExp(escapeRegex(q), 'i');
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const results = {};

    if (type === 'all' || type === 'users') {
      const [users, userCount] = await Promise.all([
        User.find({ $or: [{ name: regex }, { email: regex }] })
          .select('name email profilePhoto isCreator isVerified isAdmin role createdAt')
          .skip(skip).limit(parseInt(limit)),
        User.countDocuments({ $or: [{ name: regex }, { email: regex }] }),
      ]);
      results.users = { data: users, total: userCount };
    }

    if (type === 'all' || type === 'posts') {
      const [posts, postCount] = await Promise.all([
        Post.find({ text: regex })
          .populate('author', 'name profilePhoto')
          .skip(skip).limit(parseInt(limit)),
        Post.countDocuments({ text: regex }),
      ]);
      results.posts = { data: posts, total: postCount };
    }

    if (type === 'all' || type === 'reports') {
      const [reports, reportCount] = await Promise.all([
        Report.find({ $or: [{ reason: regex }, { description: regex }] })
          .populate('reporter', 'name')
          .populate('assignedTo', 'name')
          .skip(skip).limit(parseInt(limit)),
        Report.countDocuments({ $or: [{ reason: regex }, { description: regex }] }),
      ]);
      results.reports = { data: reports, total: reportCount };
    }

    if (type === 'all' || type === 'comments') {
      const [comments, commentCount] = await Promise.all([
        Comment.find({ text: regex })
          .populate('author', 'name profilePhoto')
          .skip(skip).limit(parseInt(limit)),
        Comment.countDocuments({ text: regex }),
      ]);
      results.comments = { data: comments, total: commentCount };
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== FILTERED QUERIES ==========

exports.getFilteredUsers = async (req, res) => {
  try {
    const { search, role, isCreator, isVerified, isBanned, isSuspended, sort = '-createdAt', page = 1, limit = 20 } = req.query;
    const filter = {};

    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }
    if (role) filter.role = role;
    if (isCreator !== undefined) filter.isCreator = isCreator === 'true';
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    if (isBanned !== undefined) filter.isBanned = isBanned === 'true';
    if (isSuspended !== undefined) filter.isSuspended = isSuspended === 'true';

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort(sort)
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.json({ users, total, pages: Math.ceil(total / parseInt(limit)), page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFilteredPosts = async (req, res) => {
  try {
    const { search, author, visibility, isBoosted, isSuspended, sort = '-createdAt', page = 1, limit = 20 } = req.query;
    const filter = {};

    if (search) filter.text = new RegExp(escapeRegex(search), 'i');
    if (author) filter.author = author;
    if (visibility) filter.visibility = visibility;
    if (isBoosted !== undefined) filter.isBoosted = isBoosted === 'true';
    if (isSuspended !== undefined) filter.isSuspended = isSuspended === 'true';

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('author', 'name profilePhoto')
        .sort(sort)
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit)),
      Post.countDocuments(filter),
    ]);

    res.json({ posts, total, pages: Math.ceil(total / parseInt(limit)), page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFilteredReports = async (req, res) => {
  try {
    const { status, reason, priority, assignedTo, sort = '-createdAt', page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (reason) filter.reason = reason;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('reporter', 'name profilePhoto')
        .populate('assignedTo', 'name')
        .sort(sort)
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit)),
      Report.countDocuments(filter),
    ]);

    res.json({ reports, total, pages: Math.ceil(total / parseInt(limit)), page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== CSV EXPORT ==========

exports.exportCSV = async (req, res) => {
  try {
    const { type, filters } = req.query;
    let data = [];
    let headers = [];

    const parsedFilters = filters ? JSON.parse(filters) : {};

    switch (type) {
      case 'users': {
        const filter = {};
        if (parsedFilters.role) filter.role = parsedFilters.role;
        if (parsedFilters.isCreator) filter.isCreator = parsedFilters.isCreator === 'true';
        if (parsedFilters.isVerified) filter.isVerified = parsedFilters.isVerified === 'true';

        const users = await User.find(filter).select('-password').limit(5000);
        headers = ['ID', 'Name', 'Email', 'Role', 'Creator', 'Verified', 'Banned', 'Suspended', 'Created'];
        data = users.map(u => [
          u._id, u.name, u.email, u.role, u.isCreator, u.isVerified,
          u.isBanned || false, u.isSuspended || false, u.createdAt?.toISOString()
        ]);
        break;
      }
      case 'posts': {
        const filter = {};
        if (parsedFilters.visibility) filter.visibility = parsedFilters.visibility;
        if (parsedFilters.author) filter.author = parsedFilters.author;

        const posts = await Post.find(filter).populate('author', 'name email').limit(5000);
        headers = ['ID', 'Author', 'Author Email', 'Text', 'Visibility', 'Boosted', 'Created'];
        data = posts.map(p => [
          p._id, p.author?.name, p.author?.email, p.text?.substring(0, 100),
          p.visibility, p.isBoosted, p.createdAt?.toISOString()
        ]);
        break;
      }
      case 'reports': {
        const filter = {};
        if (parsedFilters.status) filter.status = parsedFilters.status;
        if (parsedFilters.reason) filter.reason = parsedFilters.reason;

        const reports = await Report.find(filter)
          .populate('reporter', 'name email')
          .populate('assignedTo', 'name')
          .limit(5000);
        headers = ['ID', 'Reporter', 'Type', 'Target ID', 'Reason', 'Status', 'Priority', 'Created'];
        data = reports.map(r => [
          r._id, r.reporter?.name, r.targetType, r.targetId, r.reason,
          r.status, r.priority, r.createdAt?.toISOString()
        ]);
        break;
      }
      case 'transactions': {
        const Transaction = require('../models/Transaction');
        const txs = await Transaction.find().populate('user', 'name email').limit(5000);
        headers = ['ID', 'User', 'Email', 'Type', 'Amount', 'Status', 'Created'];
        data = txs.map(t => [
          t._id, t.user?.name, t.user?.email, t.type, t.amount, t.status, t.createdAt?.toISOString()
        ]);
        break;
      }
      default:
        return res.status(400).json({ message: 'Invalid export type' });
    }

    const csv = [headers.join(','), ...data.map(row => row.map(cell =>
      `"${String(cell ?? '').replace(/"/g, '""')}"`
    ).join(','))].join('\n');

    const safeType = type.replace(/[^a-zA-Z0-9_-]/g, '');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${safeType}_export_${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== AUDIT TRAIL ==========

exports.getAuditTrail = async (req, res) => {
  try {
    const { admin, action, targetType, from, to, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (admin) filter.admin = admin;
    if (action) filter.action = { $regex: escapeRegex(action) };
    if (targetType) filter.targetType = targetType;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const [actions, total] = await Promise.all([
      AdminAction.find(filter)
        .populate('admin', 'name email')
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit)),
      AdminAction.countDocuments(filter),
    ]);

    res.json({ actions, total, pages: Math.ceil(total / parseInt(limit)), page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAuditStats = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now - 7 * 24 * 3600000);

    const [todayCount, weekCount, byAction, topAdmins] = await Promise.all([
      AdminAction.countDocuments({ createdAt: { $gte: today } }),
      AdminAction.countDocuments({ createdAt: { $gte: weekAgo } }),
      AdminAction.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]),
      AdminAction.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        { $group: { _id: '$admin', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const populatedAdmins = await User.populate(topAdmins, { path: '_id', select: 'name email' });

    res.json({ todayCount, weekCount, byAction, topAdmins: populatedAdmins });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== NOTES ON USER CASES ==========

exports.getNotes = async (req, res) => {
  try {
    const { targetType, targetId } = req.query;
    const filter = {};
    if (targetType) filter.targetType = targetType;
    if (targetId) filter.targetId = targetId;

    const notes = await ModeratorNote.find(filter)
      .populate('author', 'name profilePhoto')
      .sort({ createdAt: -1 });

    res.json({ notes });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addNote = async (req, res) => {
  try {
    const { targetType, targetId, note, tags, isInternal } = req.body;

    const newNote = await ModeratorNote.create({
      targetType,
      targetId,
      note,
      author: req.user._id,
      tags: tags || [],
      isInternal: isInternal !== false,
    });

    await AdminAction.create({
      admin: req.user._id,
      action: 'safety.note_add',
      targetType: targetType.charAt(0).toUpperCase() + targetType.slice(1),
      targetId,
      details: { notePreview: note.substring(0, 100) },
    });

    res.status(201).json({ note: await newNote.populate('author', 'name profilePhoto') });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const note = await ModeratorNote.findByIdAndDelete(req.params.noteId);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== BULK IMPORT/EXPORT ==========

exports.bulkImport = async (req, res) => {
  try {
    const { type, data: items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No data provided' });
    }

    let imported = 0;
    let failed = 0;
    const errors = [];

    switch (type) {
      case 'keywords': {
        const KeywordBlacklist = require('../models/KeywordBlacklist');
        for (const item of items) {
          try {
            await KeywordBlacklist.findOneAndUpdate(
              { keyword: item.keyword.toLowerCase() },
              { $setOnInsert: { ...item, createdBy: req.user._id } },
              { upsert: true, new: true }
            );
            imported++;
          } catch (e) { failed++; errors.push(e.message); }
        }
        break;
      }
      case 'links': {
        const LinkBlacklist = require('../models/LinkBlacklist');
        for (const item of items) {
          try {
            await LinkBlacklist.findOneAndUpdate(
              { domain: item.domain.toLowerCase() },
              { $setOnInsert: { ...item, createdBy: req.user._id } },
              { upsert: true, new: true }
            );
            imported++;
          } catch (e) { failed++; errors.push(e.message); }
        }
        break;
      }
      case 'users': {
        for (const item of items) {
          try {
            if (item.email) {
              await User.findOneAndUpdate(
                { email: item.email },
                { $set: item },
                { upsert: true, new: true }
              );
              imported++;
            }
          } catch (e) { failed++; errors.push(e.message); }
        }
        break;
      }
      default:
        return res.status(400).json({ message: 'Invalid import type' });
    }

    await AdminAction.create({
      admin: req.user._id,
      action: 'content.bulk_remove',
      targetType: 'Post',
      targetId: req.user._id,
      details: { type, imported, failed, total: items.length },
    });

    res.json({ imported, failed, total: items.length, errors: errors.slice(0, 10) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== UNDO LAST ADMIN ACTION ==========

exports.createUndoSnapshot = async (req, res) => {
  try {
    const { targetType, targetId, action } = req.body;

    let snapshot = null;
    const Model = {
      User, Post, Comment, Story, Reel, Listing, Report, Appeal,
    }[targetType];

    if (Model) {
      snapshot = await Model.findById(targetId).lean();
    }

    if (!snapshot) {
      return res.status(404).json({ message: 'Target not found' });
    }

    const lastAction = await AdminAction.findOne({
      targetType,
      targetId,
      admin: req.user._id,
    }).sort({ createdAt: -1 });

    const undo = await UndoSnapshot.create({
      actionLog: lastAction?._id,
      admin: req.user._id,
      targetType,
      targetId,
      snapshot,
      action: action || lastAction?.action || 'unknown',
    });

    res.json({ undoId: undo._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.undoAction = async (req, res) => {
  try {
    const undo = await UndoSnapshot.findById(req.params.undoId);
    if (!undo) return res.status(404).json({ message: 'Undo snapshot not found' });
    if (undo.undone) return res.status(400).json({ message: 'Already undone' });

    const Model = {
      User, Post, Comment, Story, Reel, Listing, Report, Appeal,
    }[undo.targetType];

    if (!Model) return res.status(400).json({ message: 'Invalid target type' });

    // Restore the snapshot
    const restored = await Model.findByIdAndUpdate(
      undo.targetId,
      { $set: undo.snapshot },
      { new: true }
    );

    if (!restored) return res.status(404).json({ message: 'Target no longer exists' });

    undo.undone = true;
    undo.undoneAt = new Date();
    undo.undoneBy = req.user._id;
    await undo.save();

    await AdminAction.create({
      admin: req.user._id,
      action: 'content.bulk_remove',
      targetType: undo.targetType,
      targetId: undo.targetId,
      details: { undoOf: undo.action, undone: true },
    });

    res.json({ message: 'Action undone', restored });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUndoHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const [snapshots, total] = await Promise.all([
      UndoSnapshot.find()
        .populate('admin', 'name email')
        .populate('undoneBy', 'name email')
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit)),
      UndoSnapshot.countDocuments(),
    ]);

    res.json({ snapshots, total, pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== DASHBOARD ==========

exports.getOpsDashboard = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now - 7 * 24 * 3600000);

    const [
      totalUsers, totalPosts, totalReports, pendingReports,
      todayActions, weekActions, pendingUndos, recentNotes,
    ] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      AdminAction.countDocuments({ createdAt: { $gte: today } }),
      AdminAction.countDocuments({ createdAt: { $gte: weekAgo } }),
      UndoSnapshot.countDocuments({ undone: false }),
      ModeratorNote.countDocuments({ createdAt: { $gte: weekAgo } }),
    ]);

    res.json({
      totalUsers, totalPosts, totalReports, pendingReports,
      todayActions, weekActions, pendingUndos, recentNotes,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
