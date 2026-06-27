const NotificationPreference = require('../models/NotificationPreference');

exports.getPreferences = async (req, res) => {
  try {
    let prefs = await NotificationPreference.findOne({ user: req.user._id });
    if (!prefs) {
      prefs = await NotificationPreference.create({ user: req.user._id });
    }
    res.json({ preferences: prefs });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const { preferences, quietHours, emailNotifications } = req.body;
    let prefs = await NotificationPreference.findOne({ user: req.user._id });
    if (!prefs) {
      prefs = await NotificationPreference.create({ user: req.user._id });
    }

    if (preferences) {
      Object.keys(preferences).forEach(key => {
        if (prefs.preferences.hasOwnProperty(key)) {
          prefs.preferences[key] = preferences[key];
        }
      });
    }
    if (quietHours !== undefined) prefs.quietHours = quietHours;
    if (emailNotifications !== undefined) prefs.emailNotifications = emailNotifications;

    await prefs.save();
    res.json({ preferences: prefs });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.isNotificationEnabled = async (userId, type) => {
  try {
    const prefs = await NotificationPreference.findOne({ user: userId });
    if (!prefs) return true;
    return prefs.preferences[type] !== false;
  } catch {
    return true;
  }
};
