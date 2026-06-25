const User = require('../models/User');
const Post = require('../models/Post');
const Group = require('../models/Group');
const Page = require('../models/Page');

exports.search = async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const query = q.trim();
    const results = {};

    const searchUsers = async () => {
      return User.find(
        { $text: { $search: query }, _id: { $ne: req.user._id } },
        { score: { $meta: 'textScore' } }
      )
        .select('name profilePhoto bio')
        .sort({ score: { $meta: 'textScore' } })
        .limit(20);
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
