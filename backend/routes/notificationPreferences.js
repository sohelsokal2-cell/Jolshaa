const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getPreferences, updatePreferences } = require('../controllers/notificationPreferenceController');

router.use(protect);

router.get('/', getPreferences);
router.put('/', updatePreferences);

module.exports = router;
