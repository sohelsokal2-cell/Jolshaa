const User = require('../models/User');
const Post = require('../models/Post');
const Group = require('../models/Group');
const Page = require('../models/Page');
const FriendRequest = require('../models/FriendRequest');
const { hasId } = require('../utils/id');
const { expandQueryVariants } = require('../utils/banglaPhonetic');

exports.search = async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const query = q.trim();
    const queryVariants = expandQueryVariants(query);
    const results = {};

    // Runs `queryFn(variant)` for each phonetic variant of the query (e.g. banglish + its
    // Bangla-script transliteration) and merges/dedupes the results by _id.
    const searchAllVariants = async (queryFn) => {
      const batches = await Promise.all(queryVariants.map(queryFn));
      const seen = new Set();
      const merged = [];
      for (const batch of batches) {
        for (const doc of batch) {
          const id = doc._id.toString();
          if (!seen.has(id)) {
            seen.add(id);
            merged.push(doc);
          }
        }
      }
      return merged.slice(0, 20);
    };

    const searchUsers = async () => {
      const currentUser = await User.findById(req.user._id).select('friends blockedUsers');
      const blockedIds = (currentUser.blockedUsers || []).map(id => id.toString());

      // Find users who blocked the current user
      const blockers = await User.find({ blockedUsers: req.user._id }).select('_id');
      const blockerIds = blockers.map(u => u._id.toString());

      const excludeIds = [...new Set([...blockedIds, ...blockerIds, req.user._id.toString()])];

      const users = await searchAllVariants((variant) => User.find(
        { $text: { $search: variant }, _id: { $nin: excludeIds } },
        { score: { $meta: 'textScore' } }
      )
        .select('name profilePhoto bio friends')
        .sort({ score: { $meta: 'textScore' } })
        .limit(20));

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
      return searchAllVariants((variant) => Post.find(
        { $text: { $search: variant }, visibility: 'public' },
        { score: { $meta: 'textScore' } }
      )
        .populate('author', 'name profilePhoto')
        .sort({ score: { $meta: 'textScore' } })
        .limit(20));
    };

    const searchGroups = async () => {
      return searchAllVariants((variant) => Group.find(
        { $text: { $search: variant } },
        { score: { $meta: 'textScore' } }
      )
        .populate('creator', 'name profilePhoto')
        .sort({ score: { $meta: 'textScore' } })
        .limit(20));
    };

    const searchPages = async () => {
      return searchAllVariants((variant) => Page.find(
        { $text: { $search: variant } },
        { score: { $meta: 'textScore' } }
      )
        .populate('creator', 'name profilePhoto')
        .sort({ score: { $meta: 'textScore' } })
        .limit(20));
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

exports.advancedSearch = async (req, res) => {
  try {
    const { q, type, startDate, endDate, hashtag, author, page = 1, limit = 20 } = req.query;
    const safeLimit = Math.min(parseInt(limit) || 20, 50);
    const safePage = Math.max(parseInt(page) || 1, 1);

    let results = { users: [], posts: [], hashtags: [] };

    if (type === 'users' || !type) {
      const userQuery = {};
      if (q) {
        const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').substring(0, 100);
        userQuery.$or = [
          { name: { $regex: escaped, $options: 'i' } }
        ];
      }
      results.users = await User.find(userQuery)
        .select('name profilePhoto bio')
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit);
    }

    if (type === 'posts' || !type) {
      const postQuery = { status: 'published', visibility: 'public' };
      if (q) {
        const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').substring(0, 100);
        postQuery.text = { $regex: escaped, $options: 'i' };
      }
      if (hashtag) postQuery.hashtags = String(hashtag).toLowerCase().substring(0, 50);
      if (author) postQuery.author = author;
      if (startDate || endDate) {
        postQuery.createdAt = {};
        if (startDate) postQuery.createdAt.$gte = new Date(startDate);
        if (endDate) postQuery.createdAt.$lte = new Date(endDate);
      }

      results.posts = await Post.find(postQuery)
        .populate('author', 'name profilePhoto')
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit);
    }

    if (type === 'hashtags' || !type) {
      const hashtagResults = await Post.aggregate([
        { $unwind: '$hashtags' },
        ...(q ? [{ $match: { hashtags: { $regex: q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').substring(0, 50), $options: 'i' } } }] : []),
        { $group: { _id: '$hashtags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: safeLimit }
      ]);
      results.hashtags = hashtagResults;
    }

    res.json({ results, page: safePage, limit: safeLimit });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
