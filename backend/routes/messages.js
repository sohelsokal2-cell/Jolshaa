const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { markAsRead } = require('../controllers/messageController');

router.use(protect);

router.put('/:id/read', markAsRead);

module.exports = router;
