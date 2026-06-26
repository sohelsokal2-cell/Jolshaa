const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const TopicFeed = require('../services/topicFeed');

router.use(protect);

router.get('/', (req, res) => {
  res.json({ topics: TopicFeed.getTopics() });
});

router.get('/:topic', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const result = await TopicFeed.getTopicFeed(req.params.topic, page);
  res.json(result);
});

module.exports = router;
