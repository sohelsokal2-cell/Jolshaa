const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { sendTip, toggleTips, getTipHistory } = require('../controllers/tipController');

router.use(protect);

router.post('/send/:userId', sendTip);
router.put('/toggle', toggleTips);
router.get('/history', getTipHistory);

module.exports = router;
