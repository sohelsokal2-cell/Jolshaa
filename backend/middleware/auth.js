const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { hasId } = require('../utils/id');

const protect = async (req, res, next) => {
  try {
    // Support both httpOnly cookie and Authorization header (for backwards compatibility)
    const token = req.cookies?.token
      || (req.headers.authorization?.startsWith('Bearer')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Server configuration error' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired, please login again' });
      }
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    req.user = await User.findById(decoded.id).select('-password -sessions -loginHistory');

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
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
