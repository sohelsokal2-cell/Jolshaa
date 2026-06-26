const Comment = require('../models/Comment');
const Reaction = require('../models/Reaction');
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { hasId } = require('../utils/id');

exports.addComment = async (req, res) => {
  try {
    const { text, parentComment } = req.body;

    if (!text) return res.status(400).json({ message: 'Comment text is required' });

    // Check post exists
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Check block status between commenter and post author
    if (post.author.toString() !== req.user._id.toString()) {
      const postAuthor = await User.findById(post.author).select('blockedUsers privacy');
      if (postAuthor && hasId(postAuthor.blockedUsers, req.user._id)) {
        return res.status(403).json({ message: 'You are blocked by this user' });
      }
      const commenter = await User.findById(req.user._id).select('blockedUsers');
      if (commenter && hasId(commenter.blockedUsers, post.author)) {
        return res.status(403).json({ message: 'You have blocked this user' });
      }

      // Check comment privacy
      if (postAuthor && postAuthor.privacy && postAuthor.privacy.commentPrivacy === 'none') {
        return res.status(403).json({ message: 'Comments are disabled on this post' });
      }
    }

    const comment = await Comment.create({
      post: req.params.id,
      author: req.user._id,
      text,
      parentComment: parentComment || null
    });

    await comment.populate('author', 'name profilePhoto');

    // Notify post author (skip self)
    if (post.author.toString() !== req.user._id.toString()) {
      const notification = await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: 'comment',
        relatedPost: post._id,
        relatedComment: comment._id
      });
      const { getIO } = require('../socket');
      getIO().to(`user:${post.author}`).emit('newNotification', {
        ...notification.toObject(),
        sender: { _id: req.user._id, name: req.user.name, profilePhoto: req.user.profilePhoto }
      });
    }

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({
      post: req.params.id,
      parentComment: null
    })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name profilePhoto');

    const total = await Comment.countDocuments({
      post: req.params.id,
      parentComment: null
    });

    const commentIds = comments.map(c => c._id);
    const replies = await Comment.find({
      parentComment: { $in: commentIds }
    })
      .sort({ createdAt: 1 })
      .populate('author', 'name profilePhoto');

    const allCommentIds = [...commentIds, ...replies.map(r => r._id)];
    const reactions = await Reaction.aggregate([
      { $match: { targetType: 'Comment', targetId: { $in: allCommentIds } } },
      { $group: { _id: '$targetId', count: { $sum: 1 }, types: { $push: '$type' } } }
    ]);

    const reactionMap = {};
    reactions.forEach(r => {
      reactionMap[r._id.toString()] = { count: r.count, myReaction: null };
    });

    const myReactions = await Reaction.find({
      targetType: 'Comment',
      targetId: { $in: allCommentIds },
      user: req.user._id
    });

    myReactions.forEach(r => {
      const key = r.targetId.toString();
      if (reactionMap[key]) reactionMap[key].myReaction = r.type;
    });

    const commentsWithReplies = comments.map(comment => ({
      ...comment.toObject(),
      replies: replies
        .filter(r => r.parentComment.toString() === comment._id.toString())
        .map(r => ({
          ...r.toObject(),
          reactions: reactionMap[r._id.toString()] || { count: 0, myReaction: null }
        })),
      reactions: reactionMap[comment._id.toString()] || { count: 0, myReaction: null }
    }));

    res.json({
      comments: commentsWithReplies,
      page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    await Comment.deleteMany({ parentComment: req.params.id });
    await Comment.findByIdAndDelete(req.params.id);
    await Reaction.deleteMany({ targetType: 'Comment', targetId: req.params.id });

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.reactToComment = async (req, res) => {
  try {
    const { type } = req.body;
    const validTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid reaction type' });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const existing = await Reaction.findOne({
      user: req.user._id,
      targetType: 'Comment',
      targetId: req.params.id
    });

    if (existing) {
      if (existing.type === type) {
        await existing.deleteOne();
        return res.json({ message: 'Reaction removed', myReaction: null });
      }
      existing.type = type;
      await existing.save();
      return res.json({ message: 'Reaction updated', myReaction: type });
    }

    await Reaction.create({
      user: req.user._id,
      targetType: 'Comment',
      targetId: req.params.id,
      type
    });

    res.json({ message: 'Reaction added', myReaction: type });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
