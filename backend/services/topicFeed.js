const Post = require('../models/Post');

const TOPICS = {
  technology: ['tech', 'coding', 'programming', 'software', 'ai', 'javascript', 'python', 'web', 'app', 'digital'],
  food: ['food', 'recipe', 'cooking', 'restaurant', 'meal', 'dinner', 'lunch', 'breakfast', 'chef', 'baking'],
  travel: ['travel', 'trip', 'vacation', 'adventure', 'explore', 'wanderlust', 'passport', 'beach', 'mountain'],
  fitness: ['fitness', 'workout', 'gym', 'exercise', 'health', 'running', 'yoga', 'muscle', 'cardio'],
  music: ['music', 'song', 'concert', 'album', 'band', 'guitar', 'piano', 'singer', 'playlist'],
  sports: ['sports', 'football', 'cricket', 'basketball', 'tennis', 'soccer', 'athlete', 'match', 'game'],
  art: ['art', 'painting', 'drawing', 'design', 'photography', 'sculpture', 'gallery', 'creative'],
  fashion: ['fashion', 'style', 'outfit', 'clothing', 'dress', 'shoes', 'accessories', 'trend'],
};

class TopicFeed {
  static getTopics() {
    return Object.keys(TOPICS).map(key => ({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      keywords: TOPICS[key],
    }));
  }

  static async getTopicFeed(topic, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const keywords = TOPICS[topic] || [];

    if (keywords.length === 0) return { posts: [], page, totalPages: 0 };

    const hashtagQueries = keywords.map(k => ({ hashtags: k }));
    const textRegex = keywords.join('|');

    const posts = await Post.find({
      visibility: 'public',
      $or: [
        ...hashtagQueries,
        { text: { $regex: textRegex, $options: 'i' } },
      ],
    })
      .populate('author', 'name profilePhoto isCreator isVerified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({
      visibility: 'public',
      $or: [
        ...hashtagQueries,
        { text: { $regex: textRegex, $options: 'i' } },
      ],
    });

    return {
      posts,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    };
  }

  static detectTopic(text) {
    if (!text) return null;
    const lowerText = text.toLowerCase();

    for (const [topic, keywords] of Object.entries(TOPICS)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) return topic;
      }
    }
    return null;
  }
}

module.exports = TopicFeed;
