const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendEmail } = require('../services/emailService');

exports.sendTip = async (req, res) => {
  try {
    const { amount, message } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid tip amount is required' });
    }

    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot tip yourself' });
    }

    const recipient = await User.findById(req.params.userId);
    if (!recipient) return res.status(404).json({ message: 'User not found' });
    if (!recipient.tipsEnabled) {
      return res.status(400).json({ message: 'Tips not enabled for this user' });
    }

    const sender = await User.findById(req.user._id);

    const notification = await Notification.create({
      recipient: recipient._id,
      sender: req.user._id,
      type: 'tip',
      message: `Tipped ৳${amount}${message ? ': ' + message : ''}`,
    });

    const { getIO } = require('../socket');
    getIO().to(`user:${recipient._id}`).emit('newNotification', {
      ...notification.toObject(),
      sender: { _id: sender._id, name: sender.name, profilePhoto: sender.profilePhoto },
    });

    sendEmail({
      to: recipient.email,
      userId: recipient._id,
      template: 'tip_received',
      data: { recipientName: recipient.name, senderName: sender.name, amount, message },
    }).catch(() => {});

    res.json({ message: 'Tip sent successfully', amount });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleTips = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.tipsEnabled = !user.tipsEnabled;
    await user.save();

    res.json({ tipsEnabled: user.tipsEnabled });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTipHistory = async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const tips = await Notification.find({
      recipient: req.user._id,
      type: 'tip',
    })
      .populate('sender', 'name profilePhoto')
      .sort({ createdAt: -1 });

    res.json({ tips });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
