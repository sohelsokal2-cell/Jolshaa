const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const AIModeration = require('../services/aiModeration');
const AICaptionSuggestion = require('../services/aiCaption');
const AISearch = require('../services/aiSearch');
const aiAdvanced = require('../services/aiAdvanced');

router.use(protect);

router.post('/moderate', async (req, res) => {
  const { text } = req.body;
  const result = await aiAdvanced.moderateContent(text);
  res.json(result);
});

router.post('/caption/suggest', async (req, res) => {
  const { text, mood, hasMedia } = req.body;
  const suggestions = await aiAdvanced.generateCaption(text, mood);
  res.json({ suggestions });
});

router.post('/caption/enhance', async (req, res) => {
  const { text } = req.body;
  const suggestions = await aiAdvanced.enhanceCaption(text);
  res.json({ suggestions });
});

router.post('/caption/hashtags', (req, res) => {
  const { text } = req.body;
  const hashtags = AICaptionSuggestion.generateHashtags(text);
  res.json({ hashtags });
});

router.get('/search', async (req, res) => {
  const { q, type } = req.query;
  const results = await AISearch.search(q, req.user._id, type);
  res.json(results);
});

router.get('/feed-summary', async (req, res) => {
  const summary = await AISearch.getSmartFeedSummary(req.user._id);
  res.json({ summary });
});

module.exports = router;
