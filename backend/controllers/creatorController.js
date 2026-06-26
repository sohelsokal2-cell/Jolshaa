const User = require('../models/User');
const Post = require('../models/Post');
const Reaction = require('../models/Reaction');
const Comment = require('../models/Comment');
const FriendRequest = require('../models/FriendRequest');
const { hasId } = require('../utils/id');

exports.toggleFollow = async (req, res) => {
  try {
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    const currentUser = await User.findById(req.user._id);
    const isFollowing = hasId(currentUser.following, req.params.userId);

    if (isFollowing) {
      currentUser.following.pull(req.params.userId);
      targetUser.followers.pull(req.user._id);
    } else {
      currentUser.following.push(req.params.userId);
      targetUser.followers.push(req.user._id);
    }

    await currentUser.save();
    await targetUser.save();

    res.json({
      isFollowing: !isFollowing,
      followerCount: targetUser.followers.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('followers', 'name profilePhoto isCreator isVerified');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ followers: user.followers });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('following', 'name profilePhoto isCreator isVerified');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ following: user.following });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPostAnalytics = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const reactionCount = await Reaction.countDocuments({ targetType: 'Post', targetId: post._id });
    const commentCount = await Comment.countDocuments({ post: post._id });

    const reactionsByType = await Reaction.aggregate([
      { $match: { targetType: 'Post', targetId: post._id } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    const reach = post.analytics?.reach || Math.max(reactionCount + commentCount, 0);
    const impressions = post.analytics?.impressions || Math.max(Math.floor(reach * 1.5), 0);
    const engagement = reactionCount + commentCount + (post.analytics?.shares || 0);

    res.json({
      reach,
      impressions,
      engagement,
      reactions: reactionCount,
      comments: commentCount,
      shares: post.analytics?.shares || 0,
      clicks: post.analytics?.clicks || 0,
      reactionsByType: reactionsByType.reduce((acc, r) => {
        acc[r._id] = r.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCreatorDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.isCreator) {
      return res.status(400).json({ message: 'Not a creator account' });
    }

    const posts = await Post.find({ author: req.user._id }).sort({ createdAt: -1 });

    let totalReach = 0;
    let totalImpressions = 0;
    let totalEngagement = 0;

    posts.forEach((post) => {
      totalReach += post.analytics?.reach || 0;
      totalImpressions += post.analytics?.impressions || 0;
      totalEngagement += post.analytics?.engagement || 0;
    });

    const topPosts = posts
      .sort((a, b) => (b.analytics?.engagement || 0) - (a.analytics?.engagement || 0))
      .slice(0, 5)
      .map((p) => ({
        _id: p._id,
        text: p.text?.substring(0, 100),
        media: p.media?.[0],
        reach: p.analytics?.reach || 0,
        engagement: p.analytics?.engagement || 0,
        createdAt: p.createdAt,
      }));

    const followerGrowth = await User.aggregate([
      { $match: { _id: user._id } },
      { $project: { followerCount: { $size: '$followers' }, subscriberCount: { $size: '$subscribers' } } },
    ]);

    res.json({
      stats: {
        followerCount: user.followers.length,
        subscriberCount: user.subscribers.length,
        totalPosts: posts.length,
        totalReach,
        totalImpressions,
        totalEngagement,
        avgEngagementRate: posts.length > 0 ? Math.round(totalEngagement / posts.length) : 0,
      },
      topPosts,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAudienceInsights = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followers', 'name location gender');

    if (!user.isCreator) {
      return res.status(400).json({ message: 'Not a creator account' });
    }

    const followers = user.followers || [];

    const genderBreakdown = {};
    followers.forEach((f) => {
      const g = f.gender || 'unknown';
      genderBreakdown[g] = (genderBreakdown[g] || 0) + 1;
    });

    const locationBreakdown = {};
    followers.forEach((f) => {
      const loc = f.location || 'Unknown';
      locationBreakdown[loc] = (locationBreakdown[loc] || 0) + 1;
    });

    const topLocations = Object.entries(locationBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    res.json({
      totalFollowers: followers.length,
      genderBreakdown,
      topLocations,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.upgradeToCreator = async (req, res) => {
  try {
    const { category } = req.body;

    const user = await User.findById(req.user._id);
    user.isCreator = true;
    user.creatorCategory = category || '';
    await user.save();

    res.json({ message: 'Upgraded to creator account', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
