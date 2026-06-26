const Post = require('../models/Post');
const User = require('../models/User');
const Group = require('../models/Group');
const Page = require('../models/Page');

class AISearch {
  static async search(query, userId, type = 'all') {
    if (!query || query.length < 2) {
      return { results: [], suggestions: [] };
    }

    const results = {};
    const lowerQuery = query.toLowerCase();

    const expandedTerms = this.expandQuery(lowerQuery);

    if (type === 'all' || type === 'posts') {
      results.posts = await Post.find({
        $or: [
          { text: { $regex: expandedTerms.join('|'), $options: 'i' } },
          { hashtags: { $in: expandedTerms } },
        ],
        visibility: 'public',
      })
        .populate('author', 'name profilePhoto')
        .sort({ createdAt: -1 })
        .limit(20);
    }

    if (type === 'all' || type === 'people') {
      results.people = await User.find({
        $or: [
          { name: { $regex: lowerQuery, $options: 'i' } },
          { bio: { $regex: lowerQuery, $options: 'i' } },
        ],
      })
        .select('name profilePhoto bio isCreator isVerified')
        .limit(20);
    }

    if (type === 'all' || type === 'groups') {
      results.groups = await Group.find({
        $or: [
          { name: { $regex: lowerQuery, $options: 'i' } },
          { description: { $regex: lowerQuery, $options: 'i' } },
        ],
        visibility: 'public',
      })
        .populate('creator', 'name profilePhoto')
        .limit(20);
    }

    if (type === 'all' || type === 'pages') {
      results.pages = await Page.find({
        $or: [
          { name: { $regex: lowerQuery, $options: 'i' } },
          { description: { $regex: lowerQuery, $options: 'i' } },
        ],
      })
        .limit(20);
    }

    const suggestions = this.generateSuggestions(lowerQuery);

    return { results, suggestions };
  }

  static expandQuery(query) {
    const synonyms = {
      happy: ['joy', 'glad', 'cheerful', 'delighted'],
      sad: ['unhappy', 'sorrow', 'gloomy', 'depressed'],
      angry: ['furious', 'mad', 'irate', 'annoyed'],
      love: ['adore', 'cherish', 'treasure'],
      food: ['meal', 'eat', 'dining', 'cuisine'],
      travel: ['trip', 'journey', 'voyage', 'explore'],
    };

    const terms = [query];
    for (const [word, syns] of Object.entries(synonyms)) {
      if (query.includes(word)) {
        terms.push(...syns);
      }
    }

    return [...new Set(terms)];
  }

  static generateSuggestions(query) {
    const suggestions = [];

    if (query.length < 3) {
      suggestions.push('Try searching for a full word');
    }

    if (!query.includes('#')) {
      suggestions.push(`#${query.replace(/\s+/g, '')}`);
    }

    const related = {
      food: ['restaurants', 'recipes', 'cooking'],
      travel: ['destinations', 'adventures', 'wanderlust'],
      fitness: ['workout', 'gym', 'health'],
      music: ['songs', 'concert', 'playlist'],
    };

    for (const [key, vals] of Object.entries(related)) {
      if (query.includes(key)) {
        suggestions.push(...vals);
      }
    }

    return [...new Set(suggestions)].slice(0, 5);
  }

  static async getSmartFeedSummary(userId) {
    const user = await User.findById(userId)
      .select('friends following interests')
      .lean();

    const friendIds = (user.friends || []).map(id => id.toString());

    const recentPosts = await Post.find({
      author: { $in: friendIds },
      visibility: { $in: ['public', 'friends'] },
    })
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    const topics = {};
    recentPosts.forEach(post => {
      (post.hashtags || []).forEach(tag => {
        topics[tag] = (topics[tag] || 0) + 1;
      });
    });

    const topTopics = Object.entries(topics)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    const summary = {
      topTopics,
      totalPosts: recentPosts.length,
      activeHours: this.getPeakHours(recentPosts),
      trending: topTopics.map(t => t.tag),
    };

    return summary;
  }

  static getPeakHours(posts) {
    const hours = {};
    posts.forEach(post => {
      const hour = new Date(post.createdAt).getHours();
      hours[hour] = (hours[hour] || 0) + 1;
    });

    return Object.entries(hours)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([h]) => parseInt(h));
  }
}

module.exports = AISearch;
