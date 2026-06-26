const Post = require('../models/Post');
const User = require('../models/User');
const Group = require('../models/Group');
const Page = require('../models/Page');
const Reaction = require('../models/Reaction');

class RecommendationEngine {
  static async getRecommendedPosts(userId, limit = 20) {
    const user = await User.findById(userId)
      .select('friends following blockedUsers')
      .lean();

    const friendIds = (user.friends || []).map(id => id.toString());
    const followingIds = (user.following || []).map(id => id.toString());
    const blockedIds = (user.blockedUsers || []).map(id => id.toString());

    const userReactions = await Reaction.find({ user: userId })
      .select('post type')
      .lean();

    const reactedPostIds = userReactions.map(r => r.post.toString());
    const reactionTypes = {};
    userReactions.forEach(r => {
      reactionTypes[r.post.toString()] = r.type;
    });

    const topReactionTypes = Object.values(reactionTypes);
    const mostUsedType = topReactionTypes.sort((a, b) =>
      topReactionTypes.filter(v => v === b).length - topReactionTypes.filter(v => v === a).length
    )[0] || 'like';

    const candidatePosts = await Post.find({
      author: { $nin: [...friendIds, ...blockedIds, userId] },
      visibility: 'public',
      _id: { $nin: reactedPostIds },
    })
      .populate('author', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const scored = candidatePosts.map(post => {
      let score = 0;

      if (post.media && post.media.length > 0) score += 10;
      if (post.text && post.text.length > 100) score += 3;

      const hoursAgo = (Date.now() - new Date(post.createdAt).getTime()) / 3600000;
      score += Math.max(0, 20 - hoursAgo);

      score += Math.random() * 15;

      return { ...post, _score: score };
    });

    return scored
      .sort((a, b) => b._score - a._score)
      .slice(0, limit);
  }

  static async getRecommendedGroups(userId, limit = 10) {
    const user = await User.findById(userId).select('groups').lean();
    const memberGroupIds = (user.groups || []).map(id => id.toString());

    const groups = await Group.find({
      _id: { $nin: memberGroupIds },
      visibility: 'public',
    })
      .populate('creator', 'name profilePhoto')
      .sort({ memberCount: -1 })
      .limit(limit)
      .lean();

    return groups.map(g => ({
      ...g,
      _score: g.memberCount + Math.random() * 20,
    }));
  }

  static async getRecommendedPages(userId, limit = 10) {
    const user = await User.findById(userId).select('likedPages').lean();
    const likedPageIds = (user.likedPages || []).map(id => id.toString());

    const pages = await Page.find({
      _id: { $nin: likedPageIds },
    })
      .sort({ followerCount: -1 })
      .limit(limit)
      .lean();

    return pages.map(p => ({
      ...p,
      _score: p.followerCount + Math.random() * 20,
    }));
  }

  static async getRecommendedPeople(userId, limit = 10) {
    const user = await User.findById(userId)
      .select('friends following blockedUsers')
      .lean();

    const friendIds = (user.friends || []).map(id => id.toString());
    const followingIds = (user.following || []).map(id => id.toString());
    const blockedIds = (user.blockedUsers || []).map(id => id.toString());
    const excludeIds = [...friendIds, ...followingIds, ...blockedIds, userId];

    const friendOfFriends = await User.find({
      _id: { $in: friendIds },
    })
      .select('friends')
      .lean();

    const fofIds = new Set();
    friendOfFriends.forEach(f => {
      (f.friends || []).forEach(id => {
        const idStr = id.toString();
        if (!excludeIds.includes(idStr)) fofIds.add(idStr);
      });
    });

    let candidates;
    if (fofIds.size > 0) {
      candidates = await User.find({
        _id: { $in: [...fofIds] },
      })
        .select('name profilePhoto friends isCreator isVerified')
        .limit(limit)
        .lean();
    } else {
      candidates = await User.find({
        _id: { $nin: excludeIds },
      })
        .select('name profilePhoto friends isCreator isVerified')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
    }

    return candidates.map(c => ({
      ...c,
      mutualFriends: (c.friends || []).filter(id => friendIds.includes(id.toString())).length,
      _score: (c.friends || []).length + Math.random() * 10,
    }));
  }
}

module.exports = RecommendationEngine;
