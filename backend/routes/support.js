const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const ContactMessage = require('../models/ContactMessage');
const SupportTicket = require('../models/SupportTicket');
const UserFeedback = require('../models/UserFeedback');

router.use(protect);

// ============================================================
// CONTACT US (user-facing) -> admin ContactMessage inbox
// ============================================================
router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message, category } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Name, email, subject and message are required' });
    }
    const allowedCategories = ['general', 'support', 'feedback', 'partnership', 'abuse', 'other'];
    const contact = await ContactMessage.create({
      name,
      email,
      subject,
      message,
      category: allowedCategories.includes(category) ? category : 'general',
      userId: req.user._id,
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
    });
    res.status(201).json({ message: 'Message sent', contact });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================
// SUPPORT TICKETS (user-facing)
// ============================================================

// Create a ticket
router.post('/tickets', async (req, res) => {
  try {
    const { subject, description, category, priority } = req.body;
    if (!subject || !description) {
      return res.status(400).json({ message: 'Subject and description are required' });
    }
    const allowedCategories = ['account', 'billing', 'technical', 'content', 'safety', 'feature_request', 'other'];
    const allowedPriorities = ['low', 'medium', 'high', 'urgent'];
    const ticket = await SupportTicket.create({
      user: req.user._id,
      subject,
      description,
      category: allowedCategories.includes(category) ? category : 'other',
      priority: allowedPriorities.includes(priority) ? priority : 'medium',
      messages: [{
        sender: req.user._id,
        senderType: 'user',
        message: description,
      }],
    });
    res.status(201).json({ ticket });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// List the current user's own tickets
router.get('/tickets', async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id })
      .sort({ updatedAt: -1 });
    res.json({ tickets });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single ticket (only if owned by the user)
router.get('/tickets/:id', async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({ _id: req.params.id, user: req.user._id })
      .populate('messages.sender', 'name profilePhoto');
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json({ ticket });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// User replies to their own ticket
router.post('/tickets/:id/reply', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }
    const ticket = await SupportTicket.findOne({ _id: req.params.id, user: req.user._id });
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (ticket.status === 'closed') {
      return res.status(400).json({ message: 'This ticket is closed' });
    }
    ticket.messages.push({
      sender: req.user._id,
      senderType: 'user',
      message: message.trim(),
    });
    if (ticket.status === 'waiting_user') ticket.status = 'in_progress';
    await ticket.save();
    res.json({ ticket });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// User closes their own ticket
router.put('/tickets/:id/close', async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({ _id: req.params.id, user: req.user._id });
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    ticket.status = 'closed';
    ticket.closedAt = new Date();
    await ticket.save();
    res.json({ ticket });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================
// FEEDBACK (user-facing) -> admin UserFeedback board
// ============================================================
router.post('/feedback', async (req, res) => {
  try {
    const { type, title, description, rating, page } = req.body;
    if (!type || !title || !description) {
      return res.status(400).json({ message: 'Type, title and description are required' });
    }
    const allowedTypes = ['bug', 'feature_request', 'improvement', 'complaint', 'praise', 'other'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid feedback type' });
    }
    const feedback = await UserFeedback.create({
      user: req.user._id,
      type,
      title,
      description,
      rating: rating >= 1 && rating <= 5 ? rating : null,
      page: page || '',
      browserInfo: req.get('user-agent') || '',
    });
    res.status(201).json({ message: 'Feedback submitted', feedback });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
