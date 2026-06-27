const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { search, advancedSearch } = require('../controllers/searchController');

router.use(protect);

router.get('/advanced', advancedSearch);
router.get('/', search);

module.exports = router;
