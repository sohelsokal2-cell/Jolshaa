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

const captionTemplatesBn = {
  selfie: [
    "আজকে নিজেকে অন্যরকম লাগছে ✨",
    "ভালো মুড, ভালো দিন 🌟",
    "নিজের মতো থাকাই সবচেয়ে ভালো 😊",
  ],
  food: [
    "খাবারই আসল সুখ 🍽️",
    "পেট ভরলে মনও ভরে 😋",
    "জীবন অনিশ্চিত, আগে মিষ্টিটা খাই 🍰",
  ],
  travel: [
    "ঘুরে বেড়ানোই জীবন ✈️",
    "স্মৃতি জমাই, জিনিস না 🌍",
    "নতুন জায়গা, নতুন গল্প 🗺️",
  ],
  nature: [
    "প্রকৃতির কাছে গেলে মন ভালো হয়ে যায় 🌿",
    "আকাশ, নদী আর সবুজ - এটাই শান্তি 🌈",
  ],
  fitness: [
    "কষ্ট করলে ফল পাওয়া যায় 💪",
    "আজকের পরিশ্রম, আগামীর শক্তি 🏋️",
  ],
  generic: [
    "জীবনটা সুন্দর 🌸",
    "ছোট ছোট মুহূর্তগুলোই আসল আনন্দ 💝",
    "কৃতজ্ঞ এই মুহূর্তগুলোর জন্য 🙏",
  ],
};

const isBanglaText = (text) => /[ঀ-৿]/.test(text || '');

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
    const bangla = isBanglaText(text);

    const templateSet = bangla ? captionTemplatesBn : captionTemplates;
    const templates = templateSet[category] || templateSet.generic;

    const moodMap = {
      happy: templates.filter(t => !t.includes('😢') && !t.includes('💪')),
      sad: templateSet.nature,
      excited: templates,
    };

    const pool = moodMap[mood] || templates;

    const shuffled = pool.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }

  static enhanceCaption(text) {
    if (!text) return [];

    const bangla = isBanglaText(text);
    const suggestions = [];

    if (!text.match(/[.!?।]$/)) {
      suggestions.push(text + (bangla ? '।' : '.'));
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
    const bangla = isBanglaText(text);
    const words = (bangla ? text : text.toLowerCase()).split(/\s+/);
    const stopWords = bangla
      ? new Set(['আমি', 'তুমি', 'আমরা', 'এবং', 'বা', 'কিন্তু', 'এই', 'সেই', 'একটি', 'একটা', 'এর', 'তার', 'আমার', 'তোমার', 'হয়', 'ছিল', 'হবে'])
      : new Set(['i', 'am', 'is', 'are', 'was', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'my', 'your', 'our', 'this', 'that']);

    const minLen = bangla ? 2 : 3;
    const keywords = words
      .filter(w => w.length > minLen && !stopWords.has(w) && !w.startsWith('#'))
      .slice(0, 5);

    return keywords.map(k => '#' + k);
  }
}

module.exports = AICaptionSuggestion;
