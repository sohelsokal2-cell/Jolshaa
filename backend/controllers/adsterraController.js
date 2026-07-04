const AdsterraSettings = require('../models/AdsterraSettings');

// Get Adsterra settings (admin only)
exports.getAdsterraSettings = async (req, res) => {
  try {
    let settings = await AdsterraSettings.findOne().sort({ createdAt: -1 });
    if (!settings) {
      settings = await AdsterraSettings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update Adsterra settings (admin only)
exports.updateAdsterraSettings = async (req, res) => {
  try {
    const {
      enabled,
      publisherId,
      popunder,
      socialBar,
      nativeBanner,
      video,
      adFrequency,
      videoAdFrequency,
      allowedPages,
      blockedPages,
    } = req.body;

    let settings = await AdsterraSettings.findOne().sort({ createdAt: -1 });
    if (!settings) {
      settings = new AdsterraSettings();
    }

    if (enabled !== undefined) settings.enabled = enabled;
    if (publisherId !== undefined) settings.publisherId = publisherId;
    if (popunder !== undefined) settings.popunder = popunder;
    if (socialBar !== undefined) settings.socialBar = socialBar;
    if (nativeBanner !== undefined) settings.nativeBanner = nativeBanner;
    if (video !== undefined) settings.video = video;
    if (adFrequency !== undefined) settings.adFrequency = adFrequency;
    if (videoAdFrequency !== undefined) settings.videoAdFrequency = videoAdFrequency;
    if (allowedPages !== undefined) settings.allowedPages = allowedPages;
    if (blockedPages !== undefined) settings.blockedPages = blockedPages;
    settings.updatedBy = req.user._id;

    await settings.save();
    res.json({ message: 'Settings updated', settings });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get public ad config (for frontend to load ads)
exports.getAdConfig = async (req, res) => {
  try {
    const settings = await AdsterraSettings.findOne().sort({ createdAt: -1 });
    if (!settings || !settings.enabled) {
      return res.json({ enabled: false });
    }

    // Only return non-sensitive data
    res.json({
      enabled: true,
      popunder: settings.popunder?.enabled ? { script: settings.popunder.script } : null,
      socialBar: settings.socialBar?.enabled ? { script: settings.socialBar.script } : null,
      nativeBanner: settings.nativeBanner?.enabled ? { script: settings.nativeBanner.script } : null,
      video: settings.video?.enabled ? { script: settings.video.script } : null,
      adFrequency: settings.adFrequency,
      videoAdFrequency: settings.videoAdFrequency,
      blockedPages: settings.blockedPages || [],
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle ad format
exports.toggleAdFormat = async (req, res) => {
  try {
    const { format } = req.params;
    const { enabled } = req.body;

    const allowedFormats = ['popunder', 'socialBar', 'nativeBanner', 'video'];
    if (!allowedFormats.includes(format)) {
      return res.status(400).json({ message: 'Invalid ad format' });
    }

    const settings = await AdsterraSettings.findOne().sort({ createdAt: -1 });
    if (!settings) {
      return res.status(404).json({ message: 'Settings not found' });
    }

    settings[format].enabled = enabled;
    await settings.save();

    res.json({ message: `${format} ${enabled ? 'enabled' : 'disabled'}` });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
