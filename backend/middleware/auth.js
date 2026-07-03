const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { hasId } = require('../utils/id');

const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer')
      ? req.headers.authorization.split(' ')[1]
      : null;

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    // Enforce server-side session validity so revoked sessions and password
    // changes actually invalidate previously issued JWTs
    const hasActiveSession = Array.isArray(req.user.sessions)
      && req.user.sessions.some((s) => s.token === token);
    if (!hasActiveSession) {
      return res.status(401).json({ message: 'Session expired, please log in again' });
    }

    if (req.user.isBanned) {
      return res.status(403).json({ message: 'Account banned', banned: true, bannedAt: req.user.bannedAt, bannedReason: req.user.bannedReason });
    }

    if (req.user.isSuspended) {
      return res.status(403).json({ message: 'Account suspended', suspended: true, suspendedAt: req.user.suspendedAt, suspendedReason: req.user.suspendedReason });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const isBlockedBy = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    if (!targetId) return next();

    const targetUser = await User.findById(targetId).select('blockedUsers');
    if (targetUser && hasId(targetUser.blockedUsers, req.user._id)) {
      return res.status(403).json({ message: 'You are blocked by this user' });
    }

    if (hasId(req.user.blockedUsers, targetId)) {
      return res.status(403).json({ message: 'You have blocked this user' });
    }

    next();
  } catch (error) {
    next();
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

module.exports = { protect, isBlockedBy, adminOnly };
