const captionTemplates = {
  selfie: [
    "Feeling myself today ✨",
    "Good vibes only 🌟",
    "Living my best life 💫",
    "Self-care isn't selfish 🧖",
    "Just me being me 😊",
  ],
  food: [
    "Food is the ingredient that binds us together 🍽️",
    "Eating good, feeling good 😋",
    "Life is uncertain. Eat dessert first! 🍰",
    "Food for the soul 🍜",
    "Cooking is love made visible 👨‍🍳",
  ],
  travel: [
    "Wanderlust and city dust ✈️",
    "Collecting moments, not things 🌍",
    "Adventure awaits 🗺️",
    "Not all who wander are lost 🧭",
    "Travel is the only thing you buy that makes you richer 💰",
  ],
  nature: [
    "In every walk with nature, one receives far more than they seek 🌿",
    "Nature always wears the colors of the spirit 🌈",
    "The earth has music for those who listen 🎵",
    "Keep close to nature's heart 🌲",
  ],
  fitness: [
    "Strong is the new beautiful 💪",
    "Fitness is not about being better than someone else. It's about being better than you used to be 🏋️",
    "Sweat is just fat crying 💦",
    "The only bad workout is the one that didn't happen 🏃",
  ],
  generic: [
    "Living life to the fullest ✨",
    "Making memories 📸",
    "Grateful for moments like these 🙏",
    "Life is beautiful 🌸",
    "Enjoying the little things 💝",
  ],
};

const imageKeywords = {
  selfie: ['face', 'selfie', 'portrait', 'smile', 'mirror'],
  food: ['food', 'meal', 'restaurant', 'coffee', 'cake', 'dinner', 'lunch', 'breakfast'],
  travel: ['travel', 'beach', 'mountain', 'city', 'plane', 'hotel', 'landscape'],
  nature: ['nature', 'tree', 'flower', 'garden', 'forest', 'sky', 'sunset', 'sunrise'],
  fitness: ['gym', 'workout', 'run', 'exercise', 'sport', 'fitness'],
};

class AICaptionSuggestion {
  static analyzeImageKeywords(text, mediaCount) {
    if (!text) return 'generic';

    const lowerText = text.toLowerCase();
    for (const [category, keywords] of Object.entries(imageKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) return category;
      }
    }
    return 'generic';
  }

  static suggestCaption(text, mood, hasMedia) {
    const category = this.analyzeImageKeywords(text, hasMedia);

    const templates = captionTemplates[category] || captionTemplates.generic;

    const moodMap = {
      happy: templates.filter(t => !t.includes('😢') && !t.includes('💪')),
      sad: captionTemplates.nature,
      excited: templates,
    };

    const pool = moodMap[mood] || templates;

    const shuffled = pool.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }

  static enhanceCaption(text) {
    if (!text) return [];

    const suggestions = [];

    if (!text.match(/[.!?]$/)) {
      suggestions.push(text + '.');
    }

    const words = text.split(' ');
    if (words.length < 5) {
      suggestions.push(text + ' ✨');
      suggestions.push(text + ' 🌟');
    }

    if (!text.includes('#')) {
      const hashtags = this.generateHashtags(text);
      if (hashtags.length > 0) {
        suggestions.push(text + ' ' + hashtags.slice(0, 3).join(' '));
      }
    }

    return suggestions.slice(0, 3);
  }

  static generateHashtags(text) {
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = new Set(['i', 'am', 'is', 'are', 'was', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'my', 'your', 'our', 'this', 'that']);

    const keywords = words
      .filter(w => w.length > 3 && !stopWords.has(w) && !w.startsWith('#'))
      .slice(0, 5);

    return keywords.map(k => '#' + k);
  }
}

module.exports = AICaptionSuggestion;
