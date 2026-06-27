const SupportTicket = require('../models/SupportTicket');
const ContactMessage = require('../models/ContactMessage');
const UserFeedback = require('../models/UserFeedback');
const AccountRecovery = require('../models/AccountRecovery');
const FAQ = require('../models/FAQ');
const EmailLog = require('../models/EmailLog');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Message = require('../models/Message');
const AdminAction = require('../models/AdminAction');
const mongoose = require('mongoose');

const logAction = async (admin, action, details = {}) => {
  try {
    await AdminAction.create({ admin, action, targetType: 'Support', targetId: null, targetName: 'support', details });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

// ============================================================
// SUPPORT TICKETS
// ============================================================

exports.getTickets = async (req, res) => {
  try {
    const { status, category, priority, assignedTo, page = 1, limit = 30 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;

    const total = await SupportTicket.countDocuments(query);
    const tickets = await SupportTicket.find(query)
      .populate('user', 'name email profilePhoto')
      .populate('assignedTo', 'name email')
      .sort({ priority: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    res.json({ tickets, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('user', 'name email profilePhoto')
      .populate('assignedTo', 'name email')
      .populate('messages.sender', 'name profilePhoto');
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json({ ticket });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateTicket = async (req, res) => {
  try {
    const { status, priority, assignedTo, category } = req.body;
    const update = {};
    if (status) {
      update.status = status;
      if (status === 'resolved') update.resolvedAt = new Date();
      if (status === 'closed') update.closedAt = new Date();
    }
    if (priority) update.priority = priority;
    if (category) update.category = category;
    if (assignedTo !== undefined) update.assignedTo = assignedTo || null;

    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('user', 'name email')
      .populate('assignedTo', 'name email');

    await logAction(req.user._id, 'support.ticket.update', { ticketId: req.params.id, updates: Object.keys(update) });
    res.json({ ticket });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.replyToTicket = async (req, res) => {
  try {
    const { message } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.messages.push({
      sender: req.user._id,
      senderType: 'admin',
      message,
    });
    if (ticket.status === 'waiting_user') ticket.status = 'in_progress';
    await ticket.save();

    res.json({ ticket });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteTicket = async (req, res) => {
  try {
    await SupportTicket.findByIdAndDelete(req.params.id);
    await logAction(req.user._id, 'support.ticket.delete', { ticketId: req.params.id });
    res.json({ message: 'Ticket deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTicketStats = async (req, res) => {
  try {
    const [total, open, inProgress, waitingUser, resolved, closed] = await Promise.all([
      SupportTicket.countDocuments(),
      SupportTicket.countDocuments({ status: 'open' }),
      SupportTicket.countDocuments({ status: 'in_progress' }),
      SupportTicket.countDocuments({ status: 'waiting_user' }),
      SupportTicket.countDocuments({ status: 'resolved' }),
      SupportTicket.countDocuments({ status: 'closed' }),
    ]);

    const byCategory = await SupportTicket.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const byPriority = await SupportTicket.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const avgResolutionTime = await SupportTicket.aggregate([
      { $match: { resolvedAt: { $ne: null } } },
      { $project: { diff: { $subtract: ['$resolvedAt', '$createdAt'] } } },
      { $group: { _id: null, avg: { $avg: '$diff' } } },
    ]);

    res.json({
      total, open, inProgress, waitingUser, resolved, closed,
      byCategory,
      byPriority,
      avgResolutionHours: avgResolutionTime[0] ? Math.round(avgResolutionTime[0].avg / 3600000) : 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// CONTACT FORM INBOX
// ============================================================

exports.getContactMessages = async (req, res) => {
  try {
    const { status, category, page = 1, limit = 30 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;

    const total = await ContactMessage.countDocuments(query);
    const messages = await ContactMessage.find(query)
      .populate('userId', 'name email')
      .populate('repliedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    res.json({ messages, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateContactMessage = async (req, res) => {
  try {
    const { status, replyMessage } = req.body;
    const update = {};
    if (status) update.status = status;
    if (replyMessage) {
      update.replyMessage = replyMessage;
      update.repliedBy = req.user._id;
      update.repliedAt = new Date();
      update.status = 'replied';
    }

    const message = await ContactMessage.findByIdAndUpdate(req.params.id, update, { new: true });
    await logAction(req.user._id, 'support.contact.update', { messageId: req.params.id, status: update.status });
    res.json({ message });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteContactMessage = async (req, res) => {
  try {
    await ContactMessage.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getContactStats = async (req, res) => {
  try {
    const [total, unread, read, replied, archived] = await Promise.all([
      ContactMessage.countDocuments(),
      ContactMessage.countDocuments({ status: 'unread' }),
      ContactMessage.countDocuments({ status: 'read' }),
      ContactMessage.countDocuments({ status: 'replied' }),
      ContactMessage.countDocuments({ status: 'archived' }),
    ]);

    const byCategory = await ContactMessage.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({ total, unread, read, replied, archived, byCategory });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// USER FEEDBACK INBOX
// ============================================================

exports.getFeedback = async (req, res) => {
  try {
    const { type, status, page = 1, limit = 30 } = req.query;
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const total = await UserFeedback.countDocuments(query);
    const feedback = await UserFeedback.find(query)
      .populate('user', 'name email profilePhoto')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    res.json({ feedback, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateFeedback = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const update = {};
    if (status) {
      update.status = status;
      update.reviewedBy = req.user._id;
    }
    if (adminNote !== undefined) update.adminNote = adminNote;

    const fb = await UserFeedback.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ feedback: fb });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteFeedback = async (req, res) => {
  try {
    await UserFeedback.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFeedbackStats = async (req, res) => {
  try {
    const [total, newCount, reviewing, planned, completed, declined] = await Promise.all([
      UserFeedback.countDocuments(),
      UserFeedback.countDocuments({ status: 'new' }),
      UserFeedback.countDocuments({ status: 'reviewing' }),
      UserFeedback.countDocuments({ status: 'planned' }),
      UserFeedback.countDocuments({ status: 'completed' }),
      UserFeedback.countDocuments({ status: 'declined' }),
    ]);

    const byType = await UserFeedback.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const avgRating = await UserFeedback.aggregate([
      { $match: { rating: { $ne: null } } },
      { $group: { _id: null, avg: { $avg: '$rating' } } },
    ]);

    res.json({ total, newCount, reviewing, planned, completed, declined, byType, avgRating: avgRating[0]?.avg || 0 });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// ACCOUNT RECOVERY REQUESTS
// ============================================================

exports.getRecoveryRequests = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 30 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const total = await AccountRecovery.countDocuments(query);
    const requests = await AccountRecovery.find(query)
      .populate('user', 'name email profilePhoto')
      .populate('handledBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    res.json({ requests, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.handleRecovery = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const update = {
      status,
      handledBy: req.user._id,
      adminNote: adminNote || '',
      handledAt: new Date(),
    };

    const request = await AccountRecovery.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('user', 'name email');

    await logAction(req.user._id, 'support.recovery.handle', {
      requestId: req.params.id,
      status,
      targetUser: request.user?.name,
    });

    res.json({ request });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getRecoveryStats = async (req, res) => {
  try {
    const [total, pending, approved, rejected, expired] = await Promise.all([
      AccountRecovery.countDocuments(),
      AccountRecovery.countDocuments({ status: 'pending' }),
      AccountRecovery.countDocuments({ status: 'approved' }),
      AccountRecovery.countDocuments({ status: 'rejected' }),
      AccountRecovery.countDocuments({ status: 'expired' }),
    ]);

    const byType = await AccountRecovery.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    res.json({ total, pending, approved, rejected, expired, byType });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// EMAIL / SMS DELIVERY STATUS
// ============================================================

exports.getEmailDeliveryStatus = async (req, res) => {
  try {
    const { type, status, page = 1, limit = 50 } = req.query;
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const total = await EmailLog.countDocuments(query);
    const logs = await EmailLog.find(query)
      .populate('toUser', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    res.json({ logs, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getEmailDeliveryStats = async (req, res) => {
  try {
    const [total, sent, delivered, failed, bounced, queued] = await Promise.all([
      EmailLog.countDocuments(),
      EmailLog.countDocuments({ status: 'sent' }),
      EmailLog.countDocuments({ status: 'delivered' }),
      EmailLog.countDocuments({ status: 'failed' }),
      EmailLog.countDocuments({ status: 'bounced' }),
      EmailLog.countDocuments({ status: 'queued' }),
    ]);

    const byType = await EmailLog.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    const byTemplate = await EmailLog.aggregate([
      { $group: { _id: '$template', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const recentErrors = await EmailLog.find({ status: 'failed' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('to subject error createdAt template')
      .lean();

    const last24h = await EmailLog.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    res.json({ total, sent, delivered, failed, bounced, queued, byType, byTemplate, recentErrors, last24h });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// FAQ / CONTENT MANAGEMENT
// ============================================================

exports.getFAQs = async (req, res) => {
  try {
    const { category, isVisible, page = 1, limit = 50 } = req.query;
    const query = {};
    if (category) query.category = category;
    if (isVisible !== undefined) query.isVisible = isVisible === 'true';

    const total = await FAQ.countDocuments(query);
    const faqs = await FAQ.find(query)
      .populate('author', 'name email')
      .sort({ order: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    res.json({ faqs, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createFAQ = async (req, res) => {
  try {
    const { question, answer, category, order, isVisible, tags } = req.body;
    const faq = await FAQ.create({
      question, answer, category, order, isVisible, tags,
      author: req.user._id,
    });
    await logAction(req.user._id, 'support.faq.create', { faqId: faq._id });
    res.status(201).json({ faq });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateFAQ = async (req, res) => {
  try {
    const { question, answer, category, order, isVisible, tags } = req.body;
    const update = {};
    if (question !== undefined) update.question = question;
    if (answer !== undefined) update.answer = answer;
    if (category !== undefined) update.category = category;
    if (order !== undefined) update.order = order;
    if (isVisible !== undefined) update.isVisible = isVisible;
    if (tags !== undefined) update.tags = tags;

    const faq = await FAQ.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ faq });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteFAQ = async (req, res) => {
  try {
    await FAQ.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.reorderFAQs = async (req, res) => {
  try {
    const { orders } = req.body; // [{ id, order }]
    const ops = orders.map(({ id, order }) =>
      FAQ.findByIdAndUpdate(id, { order })
    );
    await Promise.all(ops);
    res.json({ message: 'Reordered' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// USER MERGE / SPLIT (Duplicate Accounts)
// ============================================================

exports.findDuplicateUsers = async (req, res) => {
  try {
    const { method = 'email' } = req.query;

    let duplicates = [];

    if (method === 'email') {
      // Find users with similar emails (same name, different emails)
      duplicates = await User.aggregate([
        { $project: { nameLower: { $toLower: '$name' }, email: 1, name: 1, profilePhoto: 1, createdAt: 1, isAdmin: 1 } },
        { $group: { _id: '$nameLower', users: { $push: '$$ROOT' }, count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 50 },
      ]);
    } else if (method === 'name') {
      // Find users with same name
      duplicates = await User.aggregate([
        { $project: { nameLower: { $toLower: '$name' }, email: 1, name: 1, profilePhoto: 1, createdAt: 1, isAdmin: 1 } },
        { $group: { _id: '$nameLower', users: { $push: '$$ROOT' }, count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 50 },
      ]);
    }

    res.json({ duplicates, method });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.mergeUsers = async (req, res) => {
  try {
    const { primaryUserId, secondaryUserId } = req.body;

    if (primaryUserId === secondaryUserId) {
      return res.status(400).json({ message: 'Cannot merge a user with itself' });
    }

    const primary = await User.findById(primaryUserId);
    const secondary = await User.findById(secondaryUserId);

    if (!primary || !secondary) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (primary.isAdmin || secondary.isAdmin) {
      return res.status(400).json({ message: 'Cannot merge admin accounts' });
    }

    // Transfer data from secondary to primary
    const Post = require('../models/Post');
    const Comment = require('../models/Comment');
    const Message = require('../models/Message');

    await Promise.all([
      Post.updateMany({ author: secondaryUserId }, { author: primaryUserId }),
      Comment.updateMany({ author: secondaryUserId }, { author: primaryUserId }),
      Message.updateMany({ sender: secondaryUserId }, { sender: primaryUserId }),
      User.updateMany({ friends: secondaryUserId }, { $addToSet: { friends: primaryUserId } }),
      User.updateMany({ followers: secondaryUserId }, { $addToSet: { followers: primaryUserId } }),
      User.updateMany({ following: secondaryUserId }, { $addToSet: { following: primaryUserId } }),
    ]);

    // Merge friends lists
    const secondaryUser = await User.findById(secondaryUserId);
    if (secondaryUser.friends?.length) {
      await User.findByIdAndUpdate(primaryUserId, {
        $addToSet: { friends: { $each: secondaryUser.friends } },
      });
    }

    // Delete secondary user
    await User.findByIdAndDelete(secondaryUserId);

    await logAction(req.user._id, 'support.user.merge', {
      primaryUser: primary.name,
      secondaryUser: secondary.name,
      primaryEmail: primary.email,
      secondaryEmail: secondary.email,
    });

    res.json({ message: `Merged ${secondary.name} into ${primary.name}` });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// SUPPORT DASHBOARD
// ============================================================

exports.getSupportDashboard = async (req, res) => {
  try {
    const [
      openTickets, pendingRecovery, unreadContact, newFeedback,
      failedEmails, totalTickets, resolvedToday,
    ] = await Promise.all([
      SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
      AccountRecovery.countDocuments({ status: 'pending' }),
      ContactMessage.countDocuments({ status: 'unread' }),
      UserFeedback.countDocuments({ status: 'new' }),
      EmailLog.countDocuments({ status: 'failed', createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      SupportTicket.countDocuments(),
      SupportTicket.countDocuments({
        status: 'resolved',
        resolvedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
    ]);

    const recentTickets = await SupportTicket.find()
      .populate('user', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      openTickets, pendingRecovery, unreadContact, newFeedback,
      failedEmails, totalTickets, resolvedToday,
      recentTickets,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
