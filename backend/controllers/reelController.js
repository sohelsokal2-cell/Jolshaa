const Reel = require('../models/Reel');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const { hasId } = require('../utils/id');

const MAX_REEL_DURATION_SECONDS = 60;

const uploadToCloudinary = (buffer, folder, resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

exports.createReel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Video file is required' });

    const { caption, music, hashtags } = req.body;
    const result = await uploadToCloudinary(req.file.buffer, 'jolshaa/reels', 'video');

    if (result.duration && result.duration > MAX_REEL_DURATION_SECONDS) {
      cloudinary.uploader.destroy(result.public_id, { resource_type: 'video' }).catch(() => {});
      return res.status(400).json({
        message: `Reels must be ${MAX_REEL_DURATION_SECONDS}s or shorter (this video is ${Math.round(result.duration)}s).`,
      });
    }

    let parsedHashtags = [];
    if (hashtags) {
      parsedHashtags = hashtags.split(',').map((h) => h.trim().toLowerCase()).filter(Boolean);
    }

    if (caption) {
      const tagMatches = caption.match(/#(\w+)/g);
      if (tagMatches) {
        const captionTags = tagMatches.map((t) => t.slice(1).toLowerCase());
        parsedHashtags = [...new Set([...parsedHashtags, ...captionTags])];
      }
    }

    const thumbnail = cloudinary.url(result.public_id, {
      resource_type: 'video',
      format: 'jpg',
      transformation: [
        { start_offset: '1', width: 640, height: 360, crop: 'limit', fetch_format: 'auto', quality: 'auto' },
      ],
    });

    const reel = await Reel.create({
      author: req.user._id,
      video: result.secure_url,
      thumbnail,
      caption: caption || '',
      music: music || '',
      hashtags: parsedHashtags,
    });

    await reel.populate('author', 'name profilePhoto');

    res.status(201).json({ reel });
  } catch (error) {
    console.error('Create reel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getReelsFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const currentUser = await User.findById(req.user._id).select('blockedUsers');
    const blockedIds = currentUser?.blockedUsers || [];

    const reels = await Reel.find({ author: { $nin: blockedIds }, isHidden: { $ne: true } })
      .populate('author', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Reel.countDocuments({ author: { $nin: blockedIds }, isHidden: { $ne: true } });

    const reelsWithStatus = reels.map((reel) => ({
      ...reel.toObject(),
      likeCount: reel.likes.length,
      commentCount: reel.comments.length,
      viewCount: reel.views.length,
      isLiked: hasId(reel.likes, req.user._id),
      isViewed: hasId(reel.views, req.user._id),
    }));

    res.json({ reels: reelsWithStatus, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id)
      .populate('author', 'name profilePhoto')
      .populate('comments.user', 'name profilePhoto');

    if (!reel) return res.status(404).json({ message: 'Reel not found' });
    if (reel.isHidden && reel.author._id.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    if (!hasId(reel.views, req.user._id)) {
      reel.views.push(req.user._id);
      await reel.save();
    }

    res.json({
      reel: {
        ...reel.toObject(),
        likeCount: reel.likes.length,
        commentCount: reel.comments.length,
        viewCount: reel.views.length,
        isLiked: reel.likes.some((id) => id.toString() === req.user._id.toString()),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleLikeReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: 'Reel not found' });

    const index = reel.likes.findIndex((id) => id.toString() === req.user._id.toString());
    if (index === -1) {
      reel.likes.push(req.user._id);
    } else {
      reel.likes.splice(index, 1);
    }
    await reel.save();

    res.json({
      isLiked: index === -1,
      likeCount: reel.likes.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Comment text is required' });

    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: 'Reel not found' });

    reel.comments.push({ user: req.user._id, text });
    await reel.save();

    await reel.populate('comments.user', 'name profilePhoto');
    const newComment = reel.comments[reel.comments.length - 1];

    res.status(201).json({ comment: newComment });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: 'Reel not found' });

    const comment = reel.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.user.toString() !== req.user._id.toString() &&
        reel.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    reel.comments.pull(req.params.commentId);
    await reel.save();

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.shareReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: 'Reel not found' });

    reel.shares += 1;
    await reel.save();

    res.json({ shares: reel.shares });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTrendingReels = async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 86400000);

    const reels = await Reel.aggregate([
      { $match: { createdAt: { $gte: twentyFourHoursAgo }, isHidden: { $ne: true } } },
      {
        $addFields: {
          score: {
            $add: [
              { $size: '$likes' },
              { $multiply: [{ $size: '$comments' }, 2] },
              { $size: '$views' },
            ],
          },
        },
      },
      { $sort: { score: -1 } },
      { $limit: 20 },
    ]);

    await Reel.populate(reels, { path: 'author', select: 'name profilePhoto' });

    res.json({ reels });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: 'Reel not found' });
    if (reel.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await reel.deleteOne();
    res.json({ message: 'Reel deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserReels = async (req, res) => {
  try {
    const isOwnProfile = req.params.userId === req.user._id.toString();
    const filter = isOwnProfile
      ? { author: req.params.userId }
      : { author: req.params.userId, isHidden: { $ne: true } };

    const reels = await Reel.find(filter)
      .populate('author', 'name profilePhoto')
      .sort({ createdAt: -1 });

    const reelsWithStatus = reels.map((reel) => ({
      ...reel.toObject(),
      likeCount: reel.likes.length,
      commentCount: reel.comments.length,
      viewCount: reel.views.length,
      isLiked: hasId(reel.likes, req.user._id),
    }));

    res.json({ reels: reelsWithStatus });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
