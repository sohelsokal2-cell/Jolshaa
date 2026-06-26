const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getSuggestedGroups,
  getSuggestedPages,
  getSuggestedPosts,
} = require('../controllers/suggestionController');

router.use(protect);

router.get('/groups', getSuggestedGroups);
router.get('/pages', getSuggestedPages);
router.get('/posts', getSuggestedPosts);

module.exports = router;
