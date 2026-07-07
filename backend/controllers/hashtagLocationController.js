const Hashtag = require('../models/Hashtag');
const Checkin = require('../models/Checkin');
const Post = require('../models/Post');

exports.getHashtagPage = async (req, res) => {
  try {
    const name = req.params.name.toLowerCase();
    let hashtag = await Hashtag.findOne({ name });

    if (!hashtag) {
      hashtag = await Hashtag.create({ name, createdBy: req.user._id });
    }

    const posts = await Post.find({ hashtags: name, visibility: 'public' })
      .populate('author', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ hashtag, posts });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTrendingHashtags = async (req, res) => {
  try {
    const hashtags = await Hashtag.find()
      .sort({ postCount: -1 })
      .limit(20);

    res.json({ hashtags });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createCheckin = async (req, res) => {
  try {
    const { locationName, address, lat, lng, category, division, district, upazila, message, postId, taggedUsers } = req.body;

    if (!locationName) return res.status(400).json({ message: 'Location name is required' });

    const checkin = await Checkin.create({
      user: req.user._id,
      post: postId || null,
      location: {
        name: locationName,
        address: address || '',
        category: category || '',
        division: division || '',
        district: district || '',
        upazila: upazila || '',
        coordinates: { lat: lat || null, lng: lng || null },
      },
      message: message || '',
      taggedUsers: taggedUsers || [],
    });

    await checkin.populate('user', 'name profilePhoto');
    await checkin.populate('taggedUsers', 'name profilePhoto');

    res.status(201).json({ checkin });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserCheckins = async (req, res) => {
  try {
    const checkins = await Checkin.find({ user: req.params.userId })
      .populate('user', 'name profilePhoto')
      .populate('taggedUsers', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ checkins });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getLocationCheckins = async (req, res) => {
  try {
    const checkins = await Checkin.find({ 'location.name': req.params.locationName })
      .populate('user', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ checkins });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getNearbyLocations = async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;

    if (!lat || !lng) {
      const recent = await Checkin.find()
        .select('location')
        .sort({ createdAt: -1 })
        .limit(20);

      const unique = [...new Map(recent.map(c => [c.location.name, c.location])).values()];
      return res.json({ locations: unique });
    }

    const locations = await Checkin.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          distanceField: 'distance',
          maxDistance: parseInt(radius),
          spherical: true,
        },
      },
      { $group: { _id: '$location.name', location: { $first: '$location' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    res.json({ locations: locations.map(l => ({ ...l.location, checkinCount: l.count })) });
  } catch (error) {
    res.json({ locations: [] });
  }
};

exports.deleteCheckin = async (req, res) => {
  try {
    const checkin = await Checkin.findById(req.params.id);
    if (!checkin) return res.status(404).json({ message: 'Check-in not found' });
    if (checkin.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await checkin.deleteOne();
    res.json({ message: 'Check-in deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
