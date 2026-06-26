const User = require('../models/User');
const Group = require('../models/Group');
const Page = require('../models/Page');
const Post = require('../models/Post');
const FriendRequest = require('../models/FriendRequest');

exports.getSuggestedGroups = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('groups');
    const memberGroupIds = user.groups || [];

    const groups = await Group.find({
      _id: { $nin: memberGroupIds },
      visibility: 'public',
    })
      .populate('creator', 'name profilePhoto')
      .sort({ memberCount: -1 })
      .limit(10);

    res.json({ groups });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSuggestedPages = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('likedPages');
    const likedPageIds = user.likedPages || [];

    const pages = await Page.find({
      _id: { $nin: likedPageIds },
    })
      .sort({ followerCount: -1 })
      .limit(10);

    res.json({ pages });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSuggestedPosts = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id)
      .select('friends blockedUsers');
    const friendIds = currentUser.friends || [];
    const blockedIds = currentUser.blockedUsers || [];

    const posts = await Post.find({
      author: { $nin: [...friendIds, ...blockedIds, req.user._id] },
      visibility: 'public',
    })
      .populate('author', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ posts });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
