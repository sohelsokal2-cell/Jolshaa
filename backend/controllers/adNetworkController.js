const AdNetwork = require('../models/AdNetwork');

// Initialize default ad networks
const initializeNetworks = async () => {
  const defaultNetworks = [
    { name: 'monetag', displayName: 'Monetag', priority: 5 },
    { name: 'propellerads', displayName: 'PropellerAds', priority: 4 },
    { name: 'admaven', displayName: 'AdMaven', priority: 3 },
    { name: 'adsterra', displayName: 'Adsterra', priority: 2 },
    { name: 'googleadsense', displayName: 'Google AdSense', priority: 1 },
  ];

  for (const network of defaultNetworks) {
    const exists = await AdNetwork.findOne({ name: network.name });
    if (!exists) {
      await AdNetwork.create(network);
    }
  }
};

// Get all ad networks (admin)
exports.getAllNetworks = async (req, res) => {
  try {
    await initializeNetworks();
    const networks = await AdNetwork.find().sort({ priority: -1 });
    res.json(networks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single ad network (admin)
exports.getNetwork = async (req, res) => {
  try {
    const network = await AdNetwork.findOne({ name: req.params.name });
    if (!network) {
      return res.status(404).json({ message: 'Network not found' });
    }
    res.json(network);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update ad network settings (admin)
exports.updateNetwork = async (req, res) => {
  try {
    const { name } = req.params;
    const updates = req.body;

    let network = await AdNetwork.findOne({ name });
    if (!network) {
      return res.status(404).json({ message: 'Network not found' });
    }

    // Update fields
    if (updates.enabled !== undefined) network.enabled = updates.enabled;
    if (updates.publisherId !== undefined) network.publisherId = updates.publisherId;
    if (updates.apiKey !== undefined) network.apiKey = updates.apiKey;
    if (updates.adFormats !== undefined) network.adFormats = updates.adFormats;
    if (updates.revenueModel !== undefined) network.revenueModel = updates.revenueModel;
    if (updates.adFrequency !== undefined) network.adFrequency = updates.adFrequency;
    if (updates.videoAdFrequency !== undefined) network.videoAdFrequency = updates.videoAdFrequency;
    if (updates.allowedPages !== undefined) network.allowedPages = updates.allowedPages;
    if (updates.blockedPages !== undefined) network.blockedPages = updates.blockedPages;
    if (updates.priority !== undefined) network.priority = updates.priority;
    if (updates.status !== undefined) network.status = updates.status;
    network.updatedBy = req.user._id;

    await network.save();
    res.json({ message: 'Network updated', network });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle ad network
exports.toggleNetwork = async (req, res) => {
  try {
    const { name } = req.params;
    const { enabled } = req.body;

    const network = await AdNetwork.findOne({ name });
    if (!network) {
      return res.status(404).json({ message: 'Network not found' });
    }

    network.enabled = enabled;
    network.updatedBy = req.user._id;
    await network.save();

    res.json({ message: `${network.displayName} ${enabled ? 'enabled' : 'disabled'}` });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle ad format for a network
exports.toggleAdFormat = async (req, res) => {
  try {
    const { name, format } = req.params;
    const { enabled } = req.body;

    const network = await AdNetwork.findOne({ name });
    if (!network) {
      return res.status(404).json({ message: 'Network not found' });
    }

    if (!network.adFormats[format]) {
      return res.status(400).json({ message: 'Invalid ad format' });
    }

    network.adFormats[format].enabled = enabled;
    network.updatedBy = req.user._id;
    await network.save();

    res.json({ message: `${format} ${enabled ? 'enabled' : 'disabled'} for ${network.displayName}` });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get public ad config for frontend
exports.getPublicConfig = async (req, res) => {
  try {
    const networks = await AdNetwork.find({ enabled: true })
      .sort({ priority: -1 })
      .select('name displayName adFormats adFrequency videoAdFrequency blockedPages');

    const config = {
      enabled: networks.length > 0,
      networks: {},
    };

    for (const network of networks) {
      config.networks[network.name] = {
        displayName: network.displayName,
        adFormats: {},
        adFrequency: network.adFrequency,
        videoAdFrequency: network.videoAdFrequency,
        blockedPages: network.blockedPages,
      };

      // Only include enabled ad formats with scripts
      for (const [format, data] of Object.entries(network.adFormats)) {
        if (data.enabled && data.script) {
          config.networks[network.name].adFormats[format] = {
            script: data.script,
          };
        }
      }
    }

    res.json(config);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Track impression
exports.trackImpression = async (req, res) => {
  try {
    const { network } = req.body;
    const adNetwork = await AdNetwork.findOne({ name: network });
    if (adNetwork) {
      adNetwork.totalImpressions += 1;
      await adNetwork.save();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Track click
exports.trackClick = async (req, res) => {
  try {
    const { network } = req.body;
    const adNetwork = await AdNetwork.findOne({ name: network });
    if (adNetwork) {
      adNetwork.totalClicks += 1;
      await adNetwork.save();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update revenue (for manual sync)
exports.updateRevenue = async (req, res) => {
  try {
    const { name, revenue } = req.body;
    const adNetwork = await AdNetwork.findOne({ name });
    if (adNetwork) {
      adNetwork.totalRevenue += revenue;
      adNetwork.lastSyncAt = new Date();
      await adNetwork.save();
    }
    res.json({ message: 'Revenue updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get stats for all networks (admin)
exports.getNetworkStats = async (req, res) => {
  try {
    const stats = await AdNetwork.aggregate([
      {
        $group: {
          _id: '$name',
          displayName: { $first: '$displayName' },
          totalImpressions: { $sum: '$totalImpressions' },
          totalClicks: { $sum: '$totalClicks' },
          totalRevenue: { $sum: '$totalRevenue' },
          enabled: { $first: '$enabled' },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
