const Ad = require('../models/Ad');

exports.createAd = async (req, res) => {
  try {
    const { title, description, imageUrl, linkUrl, budget, endsAt, targetAudience } = req.body;

    if (!title || !budget || !endsAt) {
      return res.status(400).json({ message: 'Title, budget, and end date are required' });
    }

    const ad = await Ad.create({
      advertiser: req.user._id,
      title,
      description: description || '',
      imageUrl: imageUrl || '',
      linkUrl: linkUrl || '',
      budget,
      endsAt,
      targetAudience: targetAudience || {},
    });

    res.status(201).json({ ad });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAds = async (req, res) => {
  try {
    const ads = await Ad.find({ advertiser: req.user._id }).sort({ createdAt: -1 });
    res.json({ ads });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getActiveAds = async (req, res) => {
  try {
    const now = new Date();
    const ads = await Ad.find({
      status: 'active',
      startsAt: { $lte: now },
      endsAt: { $gte: now },
      $expr: { $lt: ['$spent', '$budget'] },
    })
      .populate('advertiser', 'name')
      .limit(5);

    res.json({ ads });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.trackImpression = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.adId);
    if (!ad) return res.status(404).json({ message: 'Ad not found' });

    ad.impressions += 1;
    await ad.save();

    res.json({ recorded: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.trackClick = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.adId);
    if (!ad) return res.status(404).json({ message: 'Ad not found' });

    ad.clicks += 1;
    ad.spent += 0.01;
    await ad.save();

    res.json({ linkUrl: ad.linkUrl });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateAd = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.adId);
    if (!ad) return res.status(404).json({ message: 'Ad not found' });
    if (ad.advertiser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, description, imageUrl, linkUrl, status } = req.body;
    if (title !== undefined) ad.title = title;
    if (description !== undefined) ad.description = description;
    if (imageUrl !== undefined) ad.imageUrl = imageUrl;
    if (linkUrl !== undefined) ad.linkUrl = linkUrl;
    if (status !== undefined) ad.status = status;

    await ad.save();
    res.json({ ad });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteAd = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.adId);
    if (!ad) return res.status(404).json({ message: 'Ad not found' });
    if (ad.advertiser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await ad.deleteOne();
    res.json({ message: 'Ad deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAdStats = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.adId);
    if (!ad) return res.status(404).json({ message: 'Ad not found' });
    if (ad.advertiser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({
      impressions: ad.impressions,
      clicks: ad.clicks,
      ctr: ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : 0,
      spent: ad.spent,
      budget: ad.budget,
      remaining: ad.budget - ad.spent,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
