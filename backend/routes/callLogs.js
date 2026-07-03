const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const CallLog = require('../models/CallLog');

// GET /api/conversations/:id/call-logs
router.get('/:id/call-logs', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await CallLog.find({ conversation: id })
      .populate('caller', 'name profilePhoto')
      .populate('receiver', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CallLog.countDocuments({ conversation: id });

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get call logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
