const Comment = require('../models/Comment');
const Reaction = require('../models/Reaction');

exports.addComment = async (req, res) => {
  try {
    const { text, parentComment } = req.body;

    if (!text) return res.status(400).json({ message: 'Comment text is required' });

    const comment = await Comment.create({
      post: req.params.id,
      author: req.user._id,
      text,
      parentComment: parentComment || null
    });

    await comment.populate('author', 'name profilePhoto');

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
      reactionMap[r._id.toString()] = { count: r.count };
    });

    const commentsWithReplies = comments.map(comment => ({
      ...comment.toObject(),
      replies: replies
        .filter(r => r.parentComment.toString() === comment._id.toString())
        .map(r => ({
          ...r.toObject(),
          reactions: reactionMap[r._id.toString()] || { count: 0 }
        })),
      reactions: reactionMap[comment._id.toString()] || { count: 0 }
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
