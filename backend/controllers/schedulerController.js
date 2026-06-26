const ScheduledPost = require('../models/ScheduledPost');
const Draft = require('../models/Draft');
const Post = require('../models/Post');
const cloudinary = require('../config/cloudinary');

const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

exports.createScheduledPost = async (req, res) => {
  try {
    const { text, visibility, postedInType, postedInRefId, scheduledAt, hashtags } = req.body;

    if (!scheduledAt) return res.status(400).json({ message: 'Schedule date is required' });
    if (new Date(scheduledAt) <= new Date()) {
      return res.status(400).json({ message: 'Schedule date must be in the future' });
    }

    let media = [];
    if (req.files && req.files.length > 0) {
      const results = await Promise.all(
        req.files.map((f) => uploadToCloudinary(f.buffer, 'jolshaa/posts'))
      );
      media = results;
    }

    const parsedHashtags = hashtags
      ? JSON.parse(hashtags)
      : text
        ? [...new Set((text.match(/#(\w+)/g) || []).map((t) => t.slice(1).toLowerCase()))]
        : [];

    const scheduled = await ScheduledPost.create({
      author: req.user._id,
      text: text || '',
      media,
      visibility: visibility || 'public',
      postedIn: { type: postedInType || 'profile', refId: postedInRefId || null },
      scheduledAt,
      hashtags: parsedHashtags,
    });

    res.status(201).json({ scheduled });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getScheduledPosts = async (req, res) => {
  try {
    const posts = await ScheduledPost.find({
      author: req.user._id,
      status: 'pending',
    }).sort({ scheduledAt: 1 });

    res.json({ posts });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.cancelScheduled = async (req, res) => {
  try {
    const post = await ScheduledPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Not found' });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    post.status = 'cancelled';
    await post.save();

    res.json({ message: 'Cancelled' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.processScheduledPosts = async () => {
  try {
    const now = new Date();
    const pending = await ScheduledPost.find({
      status: 'pending',
      scheduledAt: { $lte: now },
    });

    for (const scheduled of pending) {
      const post = await Post.create({
        author: scheduled.author,
        text: scheduled.text,
        media: scheduled.media,
        visibility: scheduled.visibility,
        postedIn: scheduled.postedIn,
        hashtags: scheduled.hashtags,
      });

      scheduled.status = 'posted';
      await scheduled.save();
    }

    return pending.length;
  } catch (error) {
    console.error('Process scheduled posts error:', error);
    return 0;
  }
};

exports.createDraft = async (req, res) => {
  try {
    const { text, visibility, postedInType, postedInRefId, hashtags } = req.body;

    let media = [];
    if (req.files && req.files.length > 0) {
      const results = await Promise.all(
        req.files.map((f) => uploadToCloudinary(f.buffer, 'jolshaa/drafts'))
      );
      media = results;
    }

    const draft = await Draft.create({
      author: req.user._id,
      text: text || '',
      media,
      visibility: visibility || 'public',
      postedIn: { type: postedInType || 'profile', refId: postedInRefId || null },
      hashtags: hashtags ? JSON.parse(hashtags) : [],
    });

    res.status(201).json({ draft });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getDrafts = async (req, res) => {
  try {
    const drafts = await Draft.find({ author: req.user._id })
      .sort({ updatedAt: -1 });

    res.json({ drafts });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateDraft = async (req, res) => {
  try {
    const draft = await Draft.findById(req.params.id);
    if (!draft) return res.status(404).json({ message: 'Not found' });
    if (draft.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { text, visibility, hashtags } = req.body;
    if (text !== undefined) draft.text = text;
    if (visibility !== undefined) draft.visibility = visibility;
    if (hashtags !== undefined) draft.hashtags = JSON.parse(hashtags);

    await draft.save();
    res.json({ draft });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteDraft = async (req, res) => {
  try {
    const draft = await Draft.findById(req.params.id);
    if (!draft) return res.status(404).json({ message: 'Not found' });
    if (draft.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await draft.deleteOne();
    res.json({ message: 'Draft deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
