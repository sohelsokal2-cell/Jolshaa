let OpenAI = null;
let openai = null;

const initOpenAI = () => {
  if (openai) return openai;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'sk-...') {
    console.warn('[AI] OpenAI API key not configured. Using rule-based fallback.');
    return null;
  }
  try {
    OpenAI = require('openai');
    openai = new OpenAI({ apiKey });
    return openai;
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.warn('[AI] openai package not installed. Run: npm install openai');
    } else {
      console.error('[AI] OpenAI init error:', error.message);
    }
    return null;
  }
};

const moderateContent = async (text) => {
  const client = initOpenAI();
  if (!client) {
    const AIModeration = require('./aiModeration');
    return AIModeration.checkContent(text);
  }

  try {
    const response = await client.moderations.create({
      input: text,
    });

    const result = response.results[0];
    const flags = [];

    if (result.categories.hate) flags.push({ type: 'hate_speech', severity: 'high' });
    if (result.categories.harassment) flags.push({ type: 'harassment', severity: 'high' });
    if (result.categories.sexual) flags.push({ type: 'sexual_content', severity: 'medium' });
    if (result.categories.violence) flags.push({ type: 'violence', severity: 'high' });
    if (result.categories.spam) flags.push({ type: 'spam', severity: 'medium' });

    const score = Math.round(result.category_scores.hate * 100 + result.category_scores.harassment * 50);

    return {
      safe: !result.flagged,
      score: Math.min(score, 100),
      flags,
      action: result.flagged ? (score > 50 ? 'reject' : 'flag') : 'allow',
      source: 'openai',
    };
  } catch (error) {
    console.error('OpenAI moderation error:', error.message);
    const AIModeration = require('./aiModeration');
    return AIModeration.checkContent(text);
  }
};

const generateCaption = async (text, mood) => {
  const client = initOpenAI();
  if (!client) {
    const AICaptionSuggestion = require('./aiCaption');
    return AICaptionSuggestion.suggestCaption(text, mood, true);
  }

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a social media caption assistant. Generate 3 engaging caption suggestions based on the user\'s input. Keep them short, fun, and include relevant emojis. Return as a JSON array of strings.',
        },
        {
          role: 'user',
          content: `Text: "${text}"${mood ? ` Mood: ${mood}` : ''}\n\nGenerate 3 caption suggestions as a JSON array.`,
        },
      ],
      max_tokens: 200,
      temperature: 0.8,
    });

    const content = response.choices[0]?.message?.content;
    const suggestions = JSON.parse(content);
    return Array.isArray(suggestions) ? suggestions : [content];
  } catch (error) {
    console.error('OpenAI caption error:', error.message);
    const AICaptionSuggestion = require('./aiCaption');
    return AICaptionSuggestion.suggestCaption(text, mood, true);
  }
};

const enhanceCaption = async (text) => {
  const client = initOpenAI();
  if (!client) {
    const AICaptionSuggestion = require('./aiCaption');
    return AICaptionSuggestion.enhanceCaption(text);
  }

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a social media caption enhancer. Take the user\'s caption and suggest 3 enhanced versions with better engagement potential. Return as a JSON array of strings.',
        },
        {
          role: 'user',
          content: `Original caption: "${text}"\n\nSuggest 3 enhanced versions as a JSON array.`,
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    const suggestions = JSON.parse(content);
    return Array.isArray(suggestions) ? suggestions : [content];
  } catch (error) {
    console.error('OpenAI enhance error:', error.message);
    const AICaptionSuggestion = require('./aiCaption');
    return AICaptionSuggestion.enhanceCaption(text);
  }
};

module.exports = {
  moderateContent,
  generateCaption,
  enhanceCaption,
  initOpenAI,
};
