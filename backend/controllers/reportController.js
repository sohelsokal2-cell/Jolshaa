const Report = require('../models/Report');
const User = require('../models/User');
const AIModeration = require('../services/aiModeration');

exports.createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason, description, evidenceUrls } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ message: 'targetType, targetId, and reason are required' });
    }

    if (!['post', 'comment', 'user', 'story', 'message', 'reel', 'group_post', 'listing'].includes(targetType)) {
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
      evidenceUrls: evidenceUrls || [],
    });

    // Auto-escalate critical reasons
    if (['violence', 'hate_speech', 'nudity'].includes(reason)) {
      report.priority = 'high';
      report.escalationLevel = 1;
      report.escalationHistory.push({
        escalatedBy: req.user._id,
        fromLevel: 0,
        toLevel: 1,
        reason: `Auto-escalated: ${reason} report`
      });
      await report.save();
    }

    // Track reports received by target user
    if (targetType === 'user') {
      await User.findByIdAndUpdate(targetId, {
        $inc: { reportsReceived: 1 },
        lastReportedAt: new Date()
      });
      const targetUser = await User.findById(targetId);
      if (targetUser && targetUser.reportsReceived >= 3) {
        targetUser.isRepeatOffender = true;
        targetUser.safetyScore = Math.max(0, targetUser.safetyScore - 10);
        await targetUser.save();
      }
    }

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
