const Post = require('../models/Post');
const Reaction = require('../models/Reaction');
const Comment = require('../models/Comment');
const User = require('../models/User');

class FeedRanker {
  static async rankFeed(userId, posts) {
    const user = await User.findById(userId)
      .select('friends groups following')
      .lean();

    const friendIds = (user.friends || []).map(id => id.toString());
    const followingIds = (user.following || []).map(id => id.toString());

    const postIds = posts.map(p => p._id);

    const [reactionCounts, commentCounts] = await Promise.all([
      Reaction.aggregate([
        { $match: { targetType: 'Post', targetId: { $in: postIds } } },
        { $group: { _id: '$targetId', count: { $sum: 1 } } },
      ]),
      Comment.aggregate([
        { $match: { post: { $in: postIds } } },
        { $group: { _id: '$post', count: { $sum: 1 } } },
      ]),
    ]);

    const reactionMap = {};
    reactionCounts.forEach(r => { reactionMap[r._id.toString()] = r.count; });
    const commentMap = {};
    commentCounts.forEach(c => { commentMap[c._id.toString()] = c.count; });

    const scored = posts.map(post => {
      const postId = post._id.toString();
      const reactions = reactionMap[postId] || 0;
      const comments = commentMap[postId] || 0;
      const shares = post.analytics?.shares || 0;

      let score = 0;
      const reasons = [];

      // Relationship boost
      if (friendIds.includes(post.author?._id?.toString())) {
        score += 30;
        reasons.push('From a friend');
      }
      if (followingIds.includes(post.author?._id?.toString())) {
        score += 20;
        reasons.push('From someone you follow');
      }

      // Engagement score
      score += reactions * 3;
      score += comments * 5;
      score += shares * 4;
      if (reactions + comments + shares >= 10) {
        reasons.push('Popular with people you may know');
      }

      // Content type boost
      if (post.media && post.media.length > 0) score += 5;
      if (post.isBoosted) {
        score += 50;
        reasons.push('Boosted post');
      }
      if (post.isAnnouncement) {
        score += 25;
        reasons.push('Announcement');
      }

      // Recency decay (half-life 6 hours)
      const hoursAgo = (Date.now() - new Date(post.createdAt).getTime()) / 3600000;
      const decay = Math.pow(0.5, hoursAgo / 6);
      score *= decay;
      if (hoursAgo < 3) reasons.push('Recently posted');

      // Small random factor for variety
      score += Math.random() * 2;

      if (reasons.length === 0) reasons.push('Based on your activity on Jolshaa');

      return { ...post, _score: score, _reasons: reasons };
    });

    return scored.sort((a, b) => b._score - a._score);
  }

  static async getRankedFeed(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const user = await User.findById(userId)
      .select('blockedUsers friends')
      .lean();

    const blockedIds = user.blockedUsers || [];
    const friendIds = (user.friends || []).map(id => id.toString());

    const friendsPosts = await Post.find({
      author: { $in: friendIds, $nin: blockedIds },
      visibility: { $in: ['public', 'friends'] },
    })
      .populate('author', 'name profilePhoto isVerified')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const otherPosts = await Post.find({
      author: { $nin: [...friendIds, ...blockedIds, userId] },
      visibility: 'public',
    })
      .populate('author', 'name profilePhoto isVerified')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const allPosts = [...friendsPosts, ...otherPosts];
    const ranked = await this.rankFeed(userId, allPosts);

    const paginated = ranked.slice(skip, skip + limit);
    const total = allPosts.length;

    return {
      posts: paginated,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + limit < total,
    };
  }
}

module.exports = FeedRanker;
