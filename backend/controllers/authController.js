const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    const ip = req.ip || req.connection?.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    user.loginHistory.push({ ip, userAgent, timestamp: new Date(), success: true });
    user.sessions.push({ token, ip, userAgent, lastActive: new Date(), createdAt: new Date() });
    await user.save();

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePhoto: user.profilePhoto
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const ip = req.ip || req.connection?.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';
      user.loginHistory.push({ ip, userAgent, timestamp: new Date(), success: false });
      if (user.loginHistory.length > 50) user.loginHistory = user.loginHistory.slice(-50);
      await user.save();
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'Account banned', banned: true, bannedAt: user.bannedAt, bannedReason: user.bannedReason });
    }

    if (user.isSuspended) {
      return res.status(403).json({ message: 'Account suspended', suspended: true, suspendedAt: user.suspendedAt, suspendedReason: user.suspendedReason });
    }

    const token = generateToken(user._id);
    const ip = req.ip || req.connection?.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    // Track login
    user.loginHistory.push({ ip, userAgent, timestamp: new Date(), success: true });
    if (user.loginHistory.length > 50) user.loginHistory = user.loginHistory.slice(-50);

    // Track session
    user.sessions.push({ token, ip, userAgent, lastActive: new Date(), createdAt: new Date() });
    if (user.sessions.length > 10) user.sessions = user.sessions.slice(-10);

    await user.save();

    // Check if new device (for login alert)
    const previousLogins = user.loginHistory.filter(l => l.success && l._id.toString() !== user.loginHistory[user.loginHistory.length - 1]._id.toString());
    const isNewDevice = previousLogins.length === 0 || !previousLogins.some(l => l.userAgent === userAgent);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePhoto: user.profilePhoto
      },
      isNewDevice
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { sessions: { token } }
      });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.json({ message: 'Logged out successfully' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      profilePhoto: user.profilePhoto,
      coverPhoto: user.coverPhoto,
      bio: user.bio,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      education: user.education,
      work: user.work,
      location: user.location,
      isAdmin: user.isAdmin,
      role: user.role,
      isSuspended: user.isSuspended,
      suspendedAt: user.suspendedAt,
      suspendedReason: user.suspendedReason,
      isBanned: user.isBanned,
      bannedAt: user.bannedAt,
      bannedReason: user.bannedReason,
      isVerified: user.isVerified,
      verificationRequested: user.verificationRequested,
      isCreator: user.isCreator,
      warnings: user.warnings,
      restrictions: user.restrictions,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    // Invalidate all sessions except current
    const currentToken = req.headers.authorization?.split(' ')[1];
    user.sessions = user.sessions.filter(s => s.token === currentToken);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const currentToken = req.headers.authorization?.split(' ')[1];
    const sessions = user.sessions.map(s => ({
      _id: s._id,
      ip: s.ip,
      userAgent: s.userAgent,
      lastActive: s.lastActive,
      createdAt: s.createdAt,
      isCurrent: s.token === currentToken
    }));
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.revokeSession = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { sessions: { _id: req.params.id } }
    });
    res.json({ message: 'Session revoked' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.revokeAllSessions = async (req, res) => {
  try {
    const currentToken = req.headers.authorization?.split(' ')[1];
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { sessions: { token: { $ne: currentToken } } }
    });
    res.json({ message: 'All other sessions revoked' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getLoginHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const history = (user.loginHistory || []).slice(-20).reverse().map(l => ({
      ip: l.ip,
      userAgent: l.userAgent,
      timestamp: l.timestamp,
      success: l.success
    }));
    res.json({ history });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getSafety = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('safety');
    res.json({ safety: user.safety || {} });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateSafety = async (req, res) => {
  try {
    const { loginAlerts, twoFactorEnabled, contentFilterLevel, restrictedDMs } = req.body;
    const update = {};
    if (loginAlerts !== undefined) update['safety.loginAlerts'] = loginAlerts;
    if (twoFactorEnabled !== undefined) update['safety.twoFactorEnabled'] = twoFactorEnabled;
    if (contentFilterLevel !== undefined) update['safety.contentFilterLevel'] = contentFilterLevel;
    if (restrictedDMs !== undefined) update['safety.restrictedDMs'] = restrictedDMs;

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select('safety');
    res.json({ safety: user.safety });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password required to delete account' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    const Post = require('../models/Post');
    const Comment = require('../models/Comment');
    const Reaction = require('../models/Reaction');
    const Notification = require('../models/Notification');
    const Conversation = require('../models/Conversation');
    const Message = require('../models/Message');
    const Story = require('../models/Story');
    const Report = require('../models/Report');

    // Cascade delete user data
    await Post.deleteMany({ author: req.user._id });
    await Comment.deleteMany({ author: req.user._id });
    await Reaction.deleteMany({ user: req.user._id });
    await Notification.deleteMany({ $or: [{ recipient: req.user._id }, { sender: req.user._id }] });
    await Story.deleteMany({ author: req.user._id });
    await Report.deleteMany({ reporter: req.user._id });
    await Conversation.updateMany({ participants: req.user._id }, { $pull: { participants: req.user._id } });
    await Message.deleteMany({ sender: req.user._id });

    await User.findByIdAndDelete(req.user._id);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.json({ message: 'If an account exists with this email, a reset link has been sent.' });

    const crypto = require('crypto');
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = expiresAt;
    await user.save();

    // Send the raw token via email only; never expose it in the API response
    const { sendEmail } = require('../services/emailService');
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
    await sendEmail({
      to: user.email,
      template: 'password_reset',
      data: { name: user.name, resetUrl: `${clientUrl}/reset-password?token=${rawToken}` }
    });

    res.json({ message: 'If an account exists with this email, a reset link has been sent.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: 'Token and new password are required' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() }
    }).select('+password');

    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // Invalidate all existing sessions after a password reset
    user.sessions = [];
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTrustedDevices = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ devices: user.trustedDevices || [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.trustDevice = async (req, res) => {
  try {
    const { fingerprint, label } = req.body;
    if (!fingerprint) return res.status(400).json({ message: 'Device fingerprint required' });

    const user = await User.findById(req.user._id);
    const existing = user.trustedDevices.find(d => d.fingerprint === fingerprint);
    if (existing) {
      existing.lastUsedAt = new Date();
      if (label) existing.label = label;
    } else {
      user.trustedDevices.push({
        fingerprint,
        label: label || req.headers['user-agent'] || 'Unknown device',
        ip: req.ip,
        userAgent: req.headers['user-agent'] || ''
      });
    }
    await user.save();
    res.json({ message: 'Device trusted', devices: user.trustedDevices });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeTrustedDevice = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.trustedDevices = user.trustedDevices.filter(d => d._id.toString() !== req.params.deviceId);
    await user.save();
    res.json({ message: 'Device removed', devices: user.trustedDevices });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
