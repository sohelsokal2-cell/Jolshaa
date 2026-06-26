const User = require('../models/User');
const Post = require('../models/Post');
const Report = require('../models/Report');
const Comment = require('../models/Comment');
const Reaction = require('../models/Reaction');
const Notification = require('../models/Notification');
const Story = require('../models/Story');
const Group = require('../models/Group');
const Page = require('../models/Page');

exports.getUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const query = {};

    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('name email profilePhoto isAdmin isSuspended suspendedAt createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.suspendUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isAdmin) {
      return res.status(400).json({ message: 'Cannot suspend an admin' });
    }

    user.isSuspended = !user.isSuspended;
    user.suspendedAt = user.isSuspended ? new Date() : null;
    user.suspendedReason = user.isSuspended ? (reason || '') : '';
    await user.save();

    res.json({
      message: user.isSuspended ? 'User suspended' : 'User unsuspended',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isSuspended: user.isSuspended,
        suspendedAt: user.suspendedAt,
        suspendedReason: user.suspendedReason,
      },
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isAdmin) {
      return res.status(400).json({ message: 'Cannot delete an admin' });
    }

    await Post.deleteMany({ author: user._id });
    await Comment.deleteMany({ author: user._id });
    await Reaction.deleteMany({ user: user._id });
    await Notification.deleteMany({ $or: [{ recipient: user._id }, { sender: user._id }] });
    await Story.deleteMany({ author: user._id });
    await Report.deleteMany({ reporter: user._id });
    await user.deleteOne();

    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    await Post.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ post: req.params.id });
    await Reaction.deleteMany({ targetType: 'Post', targetId: req.params.id });
    await Report.deleteMany({ targetType: 'post', targetId: req.params.id });

    res.json({ message: 'Post removed' });
  } catch (error) {
    console.error('Remove post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    await Comment.deleteMany({ parentComment: req.params.id });
    await Comment.findByIdAndDelete(req.params.id);
    await Reaction.deleteMany({ targetType: 'Comment', targetId: req.params.id });
    await Report.deleteMany({ targetType: 'comment', targetId: req.params.id });

    res.json({ message: 'Comment removed' });
  } catch (error) {
    console.error('Remove comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    await story.deleteOne();
    await Report.deleteMany({ targetType: 'story', targetId: req.params.id });

    res.json({ message: 'Story removed' });
  } catch (error) {
    console.error('Remove story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getReports = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    const reports = await Report.find(query)
      .populate('reporter', 'name profilePhoto')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    res.json({
      reports,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    console.error('Admin get reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['reviewed', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.status = status;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    await report.save();

    res.json({ report });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalPosts,
      totalGroups,
      totalPages,
      activeToday,
      pendingReports,
      suspendedUsers,
    ] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Group.countDocuments(),
      Page.countDocuments(),
      User.countDocuments({ createdAt: { $gte: today } }),
      Report.countDocuments({ status: 'pending' }),
      User.countDocuments({ isSuspended: true }),
    ]);

    res.json({
      totalUsers,
      totalPosts,
      totalGroups,
      totalPages,
      activeToday,
      pendingReports,
      suspendedUsers,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
