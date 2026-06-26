const bannedWords = [
  'spam', 'scam', 'hack', 'phishing', 'malware',
  'nigger', 'faggot', 'retard', 'kike',
];

const spamPatterns = [
  /buy now/i,
  /click here/i,
  /free money/i,
  /earn \$\d+/i,
  /dm me/i,
  /whatsapp/i,
  /bitcoin/i,
  /crypto investment/i,
];

class AIModeration {
  static checkContent(text) {
    if (!text) return { safe: true, score: 0, flags: [] };

    const flags = [];
    let score = 0;

    const lowerText = text.toLowerCase();
    for (const word of bannedWords) {
      if (lowerText.includes(word)) {
        flags.push({ type: 'hate_speech', word, severity: 'high' });
        score += 30;
      }
    }

    for (const pattern of spamPatterns) {
      if (pattern.test(text)) {
        flags.push({ type: 'spam', pattern: pattern.source, severity: 'medium' });
        score += 20;
      }
    }

    const capsRatio = (text.replace(/[^A-Z]/g, '').length / text.replace(/[^a-zA-Z]/g, '').length) || 0;
    if (text.length > 20 && capsRatio > 0.7) {
      flags.push({ type: 'excessive_caps', severity: 'low' });
      score += 10;
    }

    const emojiCount = (text.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length;
    if (emojiCount > 10) {
      flags.push({ type: 'excessive_emoji', severity: 'low' });
      score += 5;
    }

    const urlCount = (text.match(/https?:\/\//g) || []).length;
    if (urlCount > 3) {
      flags.push({ type: 'excessive_links', severity: 'medium' });
      score += 15;
    }

    return {
      safe: score < 30,
      score: Math.min(score, 100),
      flags,
      action: score >= 50 ? 'reject' : score >= 30 ? 'flag' : 'allow',
    };
  }

  static async moderatePost(text) {
    const result = this.checkContent(text);
    return {
      ...result,
      recommendation: result.action === 'reject'
        ? 'This post may violate community guidelines.'
        : result.action === 'flag'
          ? 'This post has been flagged for review.'
          : 'Post is approved.',
    };
  }
}

module.exports = AIModeration;
