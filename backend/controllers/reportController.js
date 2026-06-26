const Report = require('../models/Report');

exports.createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason, description } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ message: 'targetType, targetId, and reason are required' });
    }

    if (!['post', 'comment', 'user', 'story', 'message'].includes(targetType)) {
      return res.status(400).json({ message: 'Invalid targetType' });
    }

    const existing = await Report.findOne({
      reporter: req.user._id,
      targetType,
      targetId,
      status: 'pending',
    });

    if (existing) {
      return res.status(400).json({ message: 'You have already reported this item' });
    }

    const report = await Report.create({
      reporter: req.user._id,
      targetType,
      targetId,
      reason,
      description,
    });

    res.status(201).json({ report });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ reporter: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ reports });
  } catch (error) {
    console.error('Get my reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
