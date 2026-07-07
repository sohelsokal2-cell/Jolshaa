const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { reportLimiter } = require('../middleware/rateLimiter');
const { createReport, getMyReports } = require('../controllers/reportController');

router.use(protect);

router.post('/', reportLimiter, createReport);
router.get('/my', getMyReports);

module.exports = router;
