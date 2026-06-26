const User = require('../models/User');
const Post = require('../models/Post');
const Group = require('../models/Group');
const Page = require('../models/Page');
const FriendRequest = require('../models/FriendRequest');
const { hasId } = require('../utils/id');

exports.search = async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const query = q.trim();
    const results = {};

    const searchUsers = async () => {
      const currentUser = await User.findById(req.user._id).select('friends blockedUsers');
      const blockedIds = (currentUser.blockedUsers || []).map(id => id.toString());

      // Find users who blocked the current user
      const blockers = await User.find({ blockedUsers: req.user._id }).select('_id');
      const blockerIds = blockers.map(u => u._id.toString());

      const excludeIds = [...new Set([...blockedIds, ...blockerIds, req.user._id.toString()])];

      const users = await User.find(
        { $text: { $search: query }, _id: { $nin: excludeIds } },
        { score: { $meta: 'textScore' } }
      )
        .select('name profilePhoto bio friends')
        .sort({ score: { $meta: 'textScore' } })
        .limit(20);

      return Promise.all(users.map(async (u) => {
        const isFriend = hasId(currentUser.friends, u._id);
        let friendStatus = 'none';
        let friendRequestId = null;

        if (isFriend) {
          friendStatus = 'friends';
        } else {
          const outgoing = await FriendRequest.findOne({ from: req.user._id, to: u._id, status: 'pending' });
          if (outgoing) {
            friendStatus = 'pending_sent';
            friendRequestId = outgoing._id;
          } else {
            const incoming = await FriendRequest.findOne({ from: u._id, to: req.user._id, status: 'pending' });
            if (incoming) {
              friendStatus = 'pending_received';
              friendRequestId = incoming._id;
            }
          }
        }

        return {
          _id: u._id,
          name: u.name,
          profilePhoto: u.profilePhoto,
          bio: u.bio,
          friendStatus,
          friendRequestId
        };
      }));
    };

    const searchPosts = async () => {
      return Post.find(
        { $text: { $search: query }, visibility: 'public' },
        { score: { $meta: 'textScore' } }
      )
        .populate('author', 'name profilePhoto')
        .sort({ score: { $meta: 'textScore' } })
        .limit(20);
    };

    const searchGroups = async () => {
      return Group.find(
        { $text: { $search: query } },
        { score: { $meta: 'textScore' } }
      )
        .populate('creator', 'name profilePhoto')
        .sort({ score: { $meta: 'textScore' } })
        .limit(20);
    };

    const searchPages = async () => {
      return Page.find(
        { $text: { $search: query } },
        { score: { $meta: 'textScore' } }
      )
        .populate('creator', 'name profilePhoto')
        .sort({ score: { $meta: 'textScore' } })
        .limit(20);
    };

    if (type === 'all') {
      const [users, posts, groups, pages] = await Promise.all([
        searchUsers(),
        searchPosts(),
        searchGroups(),
        searchPages(),
      ]);
      results.users = users;
      results.posts = posts;
      results.groups = groups;
      results.pages = pages;
    } else if (type === 'users') {
      results.users = await searchUsers();
    } else if (type === 'posts') {
      results.posts = await searchPosts();
    } else if (type === 'groups') {
      results.groups = await searchGroups();
    } else if (type === 'pages') {
      results.pages = await searchPages();
    } else {
      return res.status(400).json({ message: 'Invalid search type' });
    }

    res.json({ query, results });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
