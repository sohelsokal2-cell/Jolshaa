const User = require('../models/User');

const checkRestriction = (restrictionType) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id).select('restrictions');
      if (!user) return next();

      const now = new Date();
      const activeRestriction = user.restrictions.find(r => {
        if (r.type !== restrictionType) return false;
        if (r.expiresAt && r.expiresAt > now) return true;
        if (!r.expiresAt) return true;
        return false;
      });

      if (activeRestriction) {
        const message = activeRestriction.expiresAt
          ? `You are restricted from this action until ${activeRestriction.expiresAt.toLocaleDateString()}`
          : 'You are permanently restricted from this action';
        return res.status(403).json({ message, restricted: true, restrictionType });
      }

      next();
    } catch (error) {
      next();
    }
  };
};

module.exports = { checkRestriction };
