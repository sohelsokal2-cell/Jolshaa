const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Story = require('../models/Story');
const Reel = require('../models/Reel');
const Listing = require('../models/Listing');
const Group = require('../models/Group');
const HelpRequest = require('../models/HelpRequest');
const Note = require('../models/Note');
const Poll = require('../models/Poll');
const QA = require('../models/QA');
const Highlight = require('../models/Highlight');
const Message = require('../models/Message');
const Report = require('../models/Report');
const Reaction = require('../models/Reaction');
const AdminAction = require('../models/AdminAction');

const logAction = async (admin, action, targetType, targetId, targetName = '', details = {}) => {
  try {
    await AdminAction.create({ admin, action, targetType, targetId, targetName, details });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

// ============================================================
// POST MODERATION
// ============================================================

exports.getFlaggedPosts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status === 'flagged') query.isFlagged = true;
    else if (status === 'hidden') query.isHidden = true;
    else if (status === 'pending') query.moderationStatus = 'pending_review';
    else query.$or = [{ isFlagged: true }, { moderationStatus: { $ne: 'none' } }];

    const posts = await Post.find(query)
      .populate('author', 'name email profilePhoto')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Post.countDocuments(query);
    res.json({ posts, page: parseInt(page), totalPages: Math.ceil(total / limit), total });
  } catch (error) {
    console.error('Get flagged posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.flagPost = async (req, res) => {
  try {
    const { reason } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.isFlagged = !post.isFlagged;
    post.flagReason = post.isFlagged ? (reason || '') : '';
    post.moderationStatus = post.isFlagged ? 'flagged' : 'none';
    await post.save();

    await logAction(req.user._id, post.isFlagged ? 'content.flag_post' : 'content.approve_post', 'Post', post._id, post.text?.substring(0, 50), { reason });
    res.json({ message: post.isFlagged ? 'Post flagged' : 'Post unflagged', post });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.hidePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.isHidden = !post.isHidden;
    post.hiddenBy = post.isHidden ? req.user._id : null;
    post.hiddenAt = post.isHidden ? new Date() : null;
    await post.save();

    await logAction(req.user._id, post.isHidden ? 'content.hide_post' : 'content.approve_post', 'Post', post._id, post.text?.substring(0, 50));
    res.json({ message: post.isHidden ? 'Post hidden' : 'Post visible', post });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.shadowHidePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.isHidden = true;
    post.hiddenBy = req.user._id;
    post.hiddenAt = new Date();
    post.flagReason = 'shadow_hidden';
    await post.save();

    await logAction(req.user._id, 'content.shadow_hide', 'Post', post._id, post.text?.substring(0, 50), { shadowHidden: true });
    res.json({ message: 'Post shadow hidden (author still sees it)', post });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approvePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.isFlagged = false;
    post.flagReason = '';
    post.isHidden = false;
    post.moderationStatus = 'approved';
    await post.save();

    await logAction(req.user._id, 'content.approve_post', 'Post', post._id, post.text?.substring(0, 50));
    res.json({ message: 'Post approved', post });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// COMMENT MODERATION
// ============================================================

exports.getFlaggedComments = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status === 'flagged') query.isFlagged = true;
    else if (status === 'hidden') query.isHidden = true;
    else query.$or = [{ isFlagged: true }, { isHidden: true }];

    const comments = await Comment.find(query)
      .populate('author', 'name email profilePhoto')
      .populate('post', 'text')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Comment.countDocuments(query);
    res.json({ comments, page: parseInt(page), totalPages: Math.ceil(total / limit), total });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.flagComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    comment.isFlagged = !comment.isFlagged;
    await comment.save();

    await logAction(req.user._id, comment.isFlagged ? 'content.flag_comment' : 'content.approve_comment', 'Comment', comment._id, comment.text?.substring(0, 50));
    res.json({ message: comment.isFlagged ? 'Comment flagged' : 'Comment unflagged', comment });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.hideComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    comment.isHidden = !comment.isHidden;
    await comment.save();

    await logAction(req.user._id, comment.isHidden ? 'content.hide_comment' : 'content.approve_comment', 'Comment', comment._id, comment.text?.substring(0, 50));
    res.json({ message: comment.isHidden ? 'Comment hidden' : 'Comment visible', comment });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approveComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    comment.isFlagged = false;
    comment.isHidden = false;
    await comment.save();

    await logAction(req.user._id, 'content.approve_comment', 'Comment', comment._id, comment.text?.substring(0, 50));
    res.json({ message: 'Comment approved', comment });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// STORY MODERATION
// ============================================================

exports.getFlaggedStories = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status === 'flagged') query.isFlagged = true;
    else if (status === 'hidden') query.isHidden = true;
    else query.$or = [{ isFlagged: true }, { isHidden: true }];

    const stories = await Story.find(query)
      .populate('author', 'name email profilePhoto')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Story.countDocuments(query);
    res.json({ stories, page: parseInt(page), totalPages: Math.ceil(total / limit), total });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.flagStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    story.isFlagged = !story.isFlagged;
    await story.save();

    await logAction(req.user._id, story.isFlagged ? 'content.flag_story' : 'content.approve_story', 'Story', story._id);
    res.json({ message: story.isFlagged ? 'Story flagged' : 'Story unflagged', story });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.hideStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    story.isHidden = !story.isHidden;
    await story.save();

    await logAction(req.user._id, story.isHidden ? 'content.hide_story' : 'content.approve_story', 'Story', story._id);
    res.json({ message: story.isHidden ? 'Story hidden' : 'Story visible', story });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approveStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    story.isFlagged = false;
    story.isHidden = false;
    await story.save();

    await logAction(req.user._id, 'content.approve_story', 'Story', story._id);
    res.json({ message: 'Story approved', story });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// REEL MODERATION
// ============================================================

exports.getFlaggedReels = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status === 'flagged') query.isFlagged = true;
    else if (status === 'hidden') query.isHidden = true;
    else query.$or = [{ isFlagged: true }, { isHidden: true }];

    const reels = await Reel.find(query)
      .populate('author', 'name email profilePhoto')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Reel.countDocuments(query);
    res.json({ reels, page: parseInt(page), totalPages: Math.ceil(total / limit), total });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.flagReel = async (req, res) => {
  try {
    const { reason } = req.body;
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: 'Reel not found' });

    reel.isFlagged = !reel.isFlagged;
    reel.flagReason = reel.isFlagged ? (reason || '') : '';
    await reel.save();

    await logAction(req.user._id, reel.isFlagged ? 'content.flag_reel' : 'content.approve_reel', 'Reel', reel._id, reel.caption?.substring(0, 50), { reason });
    res.json({ message: reel.isFlagged ? 'Reel flagged' : 'Reel unflagged', reel });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.hideReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: 'Reel not found' });

    reel.isHidden = !reel.isHidden;
    await reel.save();

    await logAction(req.user._id, reel.isHidden ? 'content.hide_reel' : 'content.approve_reel', 'Reel', reel._id, reel.caption?.substring(0, 50));
    res.json({ message: reel.isHidden ? 'Reel hidden' : 'Reel visible', reel });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approveReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: 'Reel not found' });

    reel.isFlagged = false;
    reel.flagReason = '';
    reel.isHidden = false;
    await reel.save();

    await logAction(req.user._id, 'content.approve_reel', 'Reel', reel._id, reel.caption?.substring(0, 50));
    res.json({ message: 'Reel approved', reel });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: 'Reel not found' });

    await logAction(req.user._id, 'content.remove_reel', 'Reel', reel._id, reel.caption?.substring(0, 50));
    await reel.deleteOne();
    await Report.deleteMany({ targetType: 'reel', targetId: req.params.id });

    res.json({ message: 'Reel removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// GROUP POST MODERATION
// ============================================================

exports.getGroupPosts = async (req, res) => {
  try {
    const { groupId, page = 1, limit = 20 } = req.query;
    const query = { 'postedIn.type': 'group' };
    if (groupId) query['postedIn.refId'] = groupId;

    const posts = await Post.find(query)
      .populate('author', 'name email profilePhoto')
      .populate('postedIn.refId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Post.countDocuments(query);
    res.json({ posts, page: parseInt(page), totalPages: Math.ceil(total / limit), total });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// MARKETPLACE LISTING MODERATION
// ============================================================

exports.getListings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status === 'flagged') query.isFlagged = true;
    else if (status === 'hidden') query.isHidden = true;
    else if (status === 'active') query.status = 'active';
    else if (status === 'removed') query.status = 'removed';
    else query.$or = [{ isFlagged: true }, { isHidden: true }, { status: 'active' }];

    const listings = await Listing.find(query)
      .populate('seller', 'name email profilePhoto')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Listing.countDocuments(query);
    res.json({ listings, page: parseInt(page), totalPages: Math.ceil(total / limit), total });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.flagListing = async (req, res) => {
  try {
    const { reason } = req.body;
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    listing.isFlagged = !listing.isFlagged;
    listing.flagReason = listing.isFlagged ? (reason || '') : '';
    await listing.save();

    await logAction(req.user._id, listing.isFlagged ? 'content.flag_listing' : 'content.approve_listing', 'Listing', listing._id, listing.title, { reason });
    res.json({ message: listing.isFlagged ? 'Listing flagged' : 'Listing unflagged', listing });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.hideListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    listing.isHidden = !listing.isHidden;
    await listing.save();

    await logAction(req.user._id, listing.isHidden ? 'content.hide_listing' : 'content.approve_listing', 'Listing', listing._id, listing.title);
    res.json({ message: listing.isHidden ? 'Listing hidden' : 'Listing visible', listing });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approveListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    listing.isFlagged = false;
    listing.flagReason = '';
    listing.isHidden = false;
    await listing.save();

    await logAction(req.user._id, 'content.approve_listing', 'Listing', listing._id, listing.title);
    res.json({ message: 'Listing approved', listing });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    listing.status = 'removed';
    await listing.save();

    await logAction(req.user._id, 'content.remove_listing', 'Listing', listing._id, listing.title);
    res.json({ message: 'Listing removed', listing });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// HELP REQUEST MODERATION
// ============================================================

exports.getFlaggedHelpRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status === 'flagged') query.isFlagged = true;
    else if (status === 'hidden') query.isHidden = true;
    else query.$or = [{ isFlagged: true }, { isHidden: true }];

    const helpRequests = await HelpRequest.find(query)
      .populate('requester', 'name email profilePhoto')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await HelpRequest.countDocuments(query);
    res.json({ helpRequests, page: parseInt(page), totalPages: Math.ceil(total / limit), total });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.flagHelpRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const helpRequest = await HelpRequest.findById(req.params.id);
    if (!helpRequest) return res.status(404).json({ message: 'Help request not found' });

    helpRequest.isFlagged = !helpRequest.isFlagged;
    helpRequest.flagReason = helpRequest.isFlagged ? (reason || '') : '';
    await helpRequest.save();

    await logAction(req.user._id, helpRequest.isFlagged ? 'content.flag_help_request' : 'content.approve_help_request', 'HelpRequest', helpRequest._id, helpRequest.title, { reason });
    res.json({ message: helpRequest.isFlagged ? 'Help request flagged' : 'Help request unflagged', helpRequest });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.hideHelpRequest = async (req, res) => {
  try {
    const helpRequest = await HelpRequest.findById(req.params.id);
    if (!helpRequest) return res.status(404).json({ message: 'Help request not found' });

    helpRequest.isHidden = !helpRequest.isHidden;
    helpRequest.hiddenBy = helpRequest.isHidden ? req.user._id : null;
    helpRequest.hiddenAt = helpRequest.isHidden ? new Date() : null;
    await helpRequest.save();

    await logAction(req.user._id, helpRequest.isHidden ? 'content.hide_help_request' : 'content.approve_help_request', 'HelpRequest', helpRequest._id, helpRequest.title);
    res.json({ message: helpRequest.isHidden ? 'Help request hidden' : 'Help request visible', helpRequest });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approveHelpRequest = async (req, res) => {
  try {
    const helpRequest = await HelpRequest.findById(req.params.id);
    if (!helpRequest) return res.status(404).json({ message: 'Help request not found' });

    helpRequest.isFlagged = false;
    helpRequest.flagReason = '';
    helpRequest.isHidden = false;
    await helpRequest.save();

    await logAction(req.user._id, 'content.approve_help_request', 'HelpRequest', helpRequest._id, helpRequest.title);
    res.json({ message: 'Help request approved', helpRequest });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeHelpRequest = async (req, res) => {
  try {
    const helpRequest = await HelpRequest.findById(req.params.id);
    if (!helpRequest) return res.status(404).json({ message: 'Help request not found' });

    await logAction(req.user._id, 'content.remove_help_request', 'HelpRequest', helpRequest._id, helpRequest.title);
    await helpRequest.deleteOne();
    await Report.deleteMany({ targetType: 'help_request', targetId: req.params.id });

    res.json({ message: 'Help request removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// NOTE MODERATION
// ============================================================

exports.getFlaggedNotes = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status === 'flagged') query.isFlagged = true;
    else if (status === 'hidden') query.isHidden = true;
    else query.$or = [{ isFlagged: true }, { isHidden: true }];

    const notes = await Note.find(query)
      .populate('author', 'name email profilePhoto')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Note.countDocuments(query);
    res.json({ notes, page: parseInt(page), totalPages: Math.ceil(total / limit), total });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.flagNote = async (req, res) => {
  try {
    const { reason } = req.body;
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    note.isFlagged = !note.isFlagged;
    note.flagReason = note.isFlagged ? (reason || '') : '';
    await note.save();

    await logAction(req.user._id, note.isFlagged ? 'content.flag_note' : 'content.approve_note', 'Note', note._id, note.title, { reason });
    res.json({ message: note.isFlagged ? 'Note flagged' : 'Note unflagged', note });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.hideNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    note.isHidden = !note.isHidden;
    note.hiddenBy = note.isHidden ? req.user._id : null;
    note.hiddenAt = note.isHidden ? new Date() : null;
    await note.save();

    await logAction(req.user._id, note.isHidden ? 'content.hide_note' : 'content.approve_note', 'Note', note._id, note.title);
    res.json({ message: note.isHidden ? 'Note hidden' : 'Note visible', note });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approveNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    note.isFlagged = false;
    note.flagReason = '';
    note.isHidden = false;
    await note.save();

    await logAction(req.user._id, 'content.approve_note', 'Note', note._id, note.title);
    res.json({ message: 'Note approved', note });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    await logAction(req.user._id, 'content.remove_note', 'Note', note._id, note.title);
    await note.deleteOne();
    await Report.deleteMany({ targetType: 'note', targetId: req.params.id });

    res.json({ message: 'Note removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// POLL MODERATION
// ============================================================

exports.getFlaggedPolls = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status === 'flagged') query.isFlagged = true;
    else if (status === 'hidden') query.isHidden = true;
    else query.$or = [{ isFlagged: true }, { isHidden: true }];

    const polls = await Poll.find(query)
      .populate({ path: 'post', populate: { path: 'author', select: 'name email profilePhoto' } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Poll.countDocuments(query);
    res.json({ polls, page: parseInt(page), totalPages: Math.ceil(total / limit), total });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.flagPoll = async (req, res) => {
  try {
    const { reason } = req.body;
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });

    poll.isFlagged = !poll.isFlagged;
    poll.flagReason = poll.isFlagged ? (reason || '') : '';
    await poll.save();

    await logAction(req.user._id, poll.isFlagged ? 'content.flag_poll' : 'content.approve_poll', 'Poll', poll._id, poll.question, { reason });
    res.json({ message: poll.isFlagged ? 'Poll flagged' : 'Poll unflagged', poll });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.hidePoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });

    poll.isHidden = !poll.isHidden;
    poll.hiddenBy = poll.isHidden ? req.user._id : null;
    poll.hiddenAt = poll.isHidden ? new Date() : null;
    await poll.save();

    await logAction(req.user._id, poll.isHidden ? 'content.hide_poll' : 'content.approve_poll', 'Poll', poll._id, poll.question);
    res.json({ message: poll.isHidden ? 'Poll hidden' : 'Poll visible', poll });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approvePoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });

    poll.isFlagged = false;
    poll.flagReason = '';
    poll.isHidden = false;
    await poll.save();

    await logAction(req.user._id, 'content.approve_poll', 'Poll', poll._id, poll.question);
    res.json({ message: 'Poll approved', poll });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removePoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });

    await logAction(req.user._id, 'content.remove_poll', 'Poll', poll._id, poll.question);
    await poll.deleteOne();
    await Report.deleteMany({ targetType: 'poll', targetId: req.params.id });

    res.json({ message: 'Poll removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// Q&A MODERATION
// ============================================================

exports.getFlaggedQA = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status === 'flagged') query.isFlagged = true;
    else if (status === 'hidden') query.isHidden = true;
    else query.$or = [{ isFlagged: true }, { isHidden: true }];

    const qaItems = await QA.find(query)
      .populate({ path: 'post', populate: { path: 'author', select: 'name email profilePhoto' } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await QA.countDocuments(query);
    res.json({ qaItems, page: parseInt(page), totalPages: Math.ceil(total / limit), total });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.flagQA = async (req, res) => {
  try {
    const { reason } = req.body;
    const qa = await QA.findById(req.params.id);
    if (!qa) return res.status(404).json({ message: 'Q&A not found' });

    qa.isFlagged = !qa.isFlagged;
    qa.flagReason = qa.isFlagged ? (reason || '') : '';
    await qa.save();

    await logAction(req.user._id, qa.isFlagged ? 'content.flag_qa' : 'content.approve_qa', 'QA', qa._id, qa.question?.substring(0, 50), { reason });
    res.json({ message: qa.isFlagged ? 'Q&A flagged' : 'Q&A unflagged', qa });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.hideQA = async (req, res) => {
  try {
    const qa = await QA.findById(req.params.id);
    if (!qa) return res.status(404).json({ message: 'Q&A not found' });

    qa.isHidden = !qa.isHidden;
    qa.hiddenBy = qa.isHidden ? req.user._id : null;
    qa.hiddenAt = qa.isHidden ? new Date() : null;
    await qa.save();

    await logAction(req.user._id, qa.isHidden ? 'content.hide_qa' : 'content.approve_qa', 'QA', qa._id, qa.question?.substring(0, 50));
    res.json({ message: qa.isHidden ? 'Q&A hidden' : 'Q&A visible', qa });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approveQA = async (req, res) => {
  try {
    const qa = await QA.findById(req.params.id);
    if (!qa) return res.status(404).json({ message: 'Q&A not found' });

    qa.isFlagged = false;
    qa.flagReason = '';
    qa.isHidden = false;
    await qa.save();

    await logAction(req.user._id, 'content.approve_qa', 'QA', qa._id, qa.question?.substring(0, 50));
    res.json({ message: 'Q&A approved', qa });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeQA = async (req, res) => {
  try {
    const qa = await QA.findById(req.params.id);
    if (!qa) return res.status(404).json({ message: 'Q&A not found' });

    await logAction(req.user._id, 'content.remove_qa', 'QA', qa._id, qa.question?.substring(0, 50));
    await qa.deleteOne();
    await Report.deleteMany({ targetType: 'qa', targetId: req.params.id });

    res.json({ message: 'Q&A removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// HIGHLIGHT MODERATION
// ============================================================

exports.getFlaggedHighlights = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status === 'flagged') query.isFlagged = true;
    else if (status === 'hidden') query.isHidden = true;
    else query.$or = [{ isFlagged: true }, { isHidden: true }];

    const highlights = await Highlight.find(query)
      .populate('author', 'name email profilePhoto')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Highlight.countDocuments(query);
    res.json({ highlights, page: parseInt(page), totalPages: Math.ceil(total / limit), total });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.flagHighlight = async (req, res) => {
  try {
    const { reason } = req.body;
    const highlight = await Highlight.findById(req.params.id);
    if (!highlight) return res.status(404).json({ message: 'Highlight not found' });

    highlight.isFlagged = !highlight.isFlagged;
    highlight.flagReason = highlight.isFlagged ? (reason || '') : '';
    await highlight.save();

    await logAction(req.user._id, highlight.isFlagged ? 'content.flag_highlight' : 'content.approve_highlight', 'Highlight', highlight._id, highlight.title, { reason });
    res.json({ message: highlight.isFlagged ? 'Highlight flagged' : 'Highlight unflagged', highlight });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.hideHighlight = async (req, res) => {
  try {
    const highlight = await Highlight.findById(req.params.id);
    if (!highlight) return res.status(404).json({ message: 'Highlight not found' });

    highlight.isHidden = !highlight.isHidden;
    highlight.hiddenBy = highlight.isHidden ? req.user._id : null;
    highlight.hiddenAt = highlight.isHidden ? new Date() : null;
    await highlight.save();

    await logAction(req.user._id, highlight.isHidden ? 'content.hide_highlight' : 'content.approve_highlight', 'Highlight', highlight._id, highlight.title);
    res.json({ message: highlight.isHidden ? 'Highlight hidden' : 'Highlight visible', highlight });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approveHighlight = async (req, res) => {
  try {
    const highlight = await Highlight.findById(req.params.id);
    if (!highlight) return res.status(404).json({ message: 'Highlight not found' });

    highlight.isFlagged = false;
    highlight.flagReason = '';
    highlight.isHidden = false;
    await highlight.save();

    await logAction(req.user._id, 'content.approve_highlight', 'Highlight', highlight._id, highlight.title);
    res.json({ message: 'Highlight approved', highlight });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeHighlight = async (req, res) => {
  try {
    const highlight = await Highlight.findById(req.params.id);
    if (!highlight) return res.status(404).json({ message: 'Highlight not found' });

    await logAction(req.user._id, 'content.remove_highlight', 'Highlight', highlight._id, highlight.title);
    await highlight.deleteOne();

    res.json({ message: 'Highlight removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// MESSAGE MODERATION
// ============================================================

exports.getFlaggedMessages = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { isFlagged: true };

    const messages = await Message.find(query)
      .populate('sender', 'name email profilePhoto')
      .populate('conversation', 'name isGroup')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Message.countDocuments(query);
    res.json({ messages, page: parseInt(page), totalPages: Math.ceil(total / limit), total });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.flagMessage = async (req, res) => {
  try {
    const { reason } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    message.isFlagged = !message.isFlagged;
    message.flagReason = message.isFlagged ? (reason || '') : '';
    await message.save();

    await logAction(req.user._id, message.isFlagged ? 'content.flag_message' : 'content.approve_message', 'Message', message._id, message.text?.substring(0, 50), { reason });
    res.json({ message: message.isFlagged ? 'Message flagged' : 'Message unflagged', message });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    await logAction(req.user._id, 'content.remove_message', 'Message', message._id, message.text?.substring(0, 50));
    await message.deleteOne();
    await Report.deleteMany({ targetType: 'message', targetId: req.params.id });

    res.json({ message: 'Message removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// BULK ACTIONS
// ============================================================

exports.bulkAction = async (req, res) => {
  try {
    const { type, ids, action } = req.body;
    if (!type || !ids || !Array.isArray(ids) || !action) {
      return res.status(400).json({ message: 'type, ids array, and action are required' });
    }
    if (ids.length === 0 || ids.length > 100) {
      return res.status(400).json({ message: 'ids must contain between 1 and 100 items' });
    }

    const validTypes = ['post', 'comment', 'story', 'reel', 'listing', 'help_request', 'note', 'poll', 'qa', 'highlight', 'message'];
    const validActions = ['remove', 'flag', 'hide', 'approve', 'unflag', 'unhide'];

    if (!validTypes.includes(type)) return res.status(400).json({ message: 'Invalid content type' });
    if (!validActions.includes(action)) return res.status(400).json({ message: 'Invalid action' });

    const Model = { post: Post, comment: Comment, story: Story, reel: Reel, listing: Listing, help_request: HelpRequest, note: Note, poll: Poll, qa: QA, highlight: Highlight, message: Message }[type];
    let result;

    if (action === 'remove') {
      if (type === 'listing') {
        result = await Model.updateMany({ _id: { $in: ids } }, { status: 'removed' });
      } else {
        result = await Model.deleteMany({ _id: { $in: ids } });
        if (type === 'post') {
          await Comment.deleteMany({ post: { $in: ids } });
          await Reaction.deleteMany({ targetType: 'Post', targetId: { $in: ids } });
        }
      }
    } else if (action === 'flag') {
      result = await Model.updateMany({ _id: { $in: ids } }, { isFlagged: true });
    } else if (action === 'unflag') {
      result = await Model.updateMany({ _id: { $in: ids } }, { isFlagged: false, flagReason: '' });
    } else if (action === 'hide') {
      result = await Model.updateMany({ _id: { $in: ids } }, { isHidden: true, hiddenBy: req.user._id, hiddenAt: new Date() });
    } else if (action === 'unhide') {
      result = await Model.updateMany({ _id: { $in: ids } }, { isHidden: false, hiddenBy: null, hiddenAt: null });
    } else if (action === 'approve') {
      const update = { isFlagged: false, flagReason: '', isHidden: false };
      if (type === 'post') update.moderationStatus = 'approved';
      result = await Model.updateMany({ _id: { $in: ids } }, update);
    }

    await logAction(req.user._id, `content.bulk_${action}`, type.charAt(0).toUpperCase() + type.slice(1), ids[0], `${ids.length} items`, { type, action, count: ids.length });

    res.json({ message: `Bulk ${action} completed`, affected: result.modifiedCount || result.deletedCount || 0 });
  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// SHADOW MODERATION
// ============================================================

exports.shadowHide = async (req, res) => {
  try {
    const { type, id } = req.params;
    const validTypes = { post: Post, comment: Comment, story: Story, reel: Reel, listing: Listing, help_request: HelpRequest, note: Note, poll: Poll, qa: QA, highlight: Highlight };
    const Model = validTypes[type];
    if (!Model) return res.status(400).json({ message: 'Invalid content type' });

    const item = await Model.findById(id);
    if (!item) return res.status(404).json({ message: 'Content not found' });

    item.isHidden = true;
    if (item.hiddenBy !== undefined) item.hiddenBy = req.user._id;
    if (item.hiddenAt !== undefined) item.hiddenAt = new Date();
    if (item.flagReason !== undefined) item.flagReason = 'shadow_hidden';
    await item.save();

    await logAction(req.user._id, 'content.shadow_hide', type.charAt(0).toUpperCase() + type.slice(1), item._id, '', { shadowHidden: true });
    res.json({ message: 'Content shadow hidden (author still sees it, others do not)' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getContentStats = async (req, res) => {
  try {
    const [flaggedPosts, hiddenPosts, flaggedComments, hiddenComments, flaggedStories, hiddenStories, flaggedReels, hiddenReels, flaggedListings, hiddenListings, pendingReports, totalReports] = await Promise.all([
      Post.countDocuments({ isFlagged: true }),
      Post.countDocuments({ isHidden: true }),
      Comment.countDocuments({ isFlagged: true }),
      Comment.countDocuments({ isHidden: true }),
      Story.countDocuments({ isFlagged: true }),
      Story.countDocuments({ isHidden: true }),
      Reel.countDocuments({ isFlagged: true }),
      Reel.countDocuments({ isHidden: true }),
      Listing.countDocuments({ isFlagged: true }),
      Listing.countDocuments({ isHidden: true }),
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments(),
    ]);

    res.json({
      flaggedPosts, hiddenPosts,
      flaggedComments, hiddenComments,
      flaggedStories, hiddenStories,
      flaggedReels, hiddenReels,
      flaggedListings, hiddenListings,
      pendingReports, totalReports,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
