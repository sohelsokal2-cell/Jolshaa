const Group = require('../models/Group');
const Page = require('../models/Page');
const Event = require('../models/Event');
const Post = require('../models/Post');
const Report = require('../models/Report');
const AutoModRule = require('../models/AutoModRule');
const KeywordBlacklist = require('../models/KeywordBlacklist');
const LinkBlacklist = require('../models/LinkBlacklist');
const MediaRestriction = require('../models/MediaRestriction');
const GuidelineViolation = require('../models/GuidelineViolation');
const User = require('../models/User');
const Notification = require('../models/Notification');

// ========== GROUP APPROVAL TOOLS ==========

exports.getGroupDashboard = async (req, res) => {
  try {
    const [totalGroups, pendingGroups, publicGroups, privateGroups, recentGroups] = await Promise.all([
      Group.countDocuments(),
      Group.countDocuments({ pendingRequests: { $exists: true, $ne: [] } }),
      Group.countDocuments({ privacy: 'public' }),
      Group.countDocuments({ privacy: 'private' }),
      Group.find()
        .populate('creator', 'name profilePhoto')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    res.json({ totalGroups, pendingGroups, publicGroups, privateGroups, recentGroups });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllGroups = async (req, res) => {
  try {
    const { privacy, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (privacy) filter.privacy = privacy;

    const [groups, total] = await Promise.all([
      Group.find(filter)
        .populate('creator', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Group.countDocuments(filter),
    ]);

    res.json({ groups, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Remove from pending if applicable
    group.pendingRequests = [];
    await group.save();

    await Notification.create({
      recipient: group.creator,
      type: 'system',
      message: `Your group "${group.name}" has been approved`,
    });

    res.json({ group });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeGroup = async (req, res) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    await Notification.create({
      recipient: group.creator,
      type: 'system',
      message: `Your group "${group.name}" has been removed for policy violation`,
    });

    res.json({ message: 'Group removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateGroupPrivacy = async (req, res) => {
  try {
    const { privacy } = req.body;
    const group = await Group.findByIdAndUpdate(
      req.params.groupId,
      { privacy },
      { new: true }
    );
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json({ group });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== PAGE VERIFICATION TOOLS ==========

exports.getPageDashboard = async (req, res) => {
  try {
    const [totalPages, verifiedPages, pendingVerification, categories, recentPages] = await Promise.all([
      Page.countDocuments(),
      Page.countDocuments({ isVerified: true }),
      Page.countDocuments({ isVerified: false }),
      Page.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Page.find()
        .populate('creator', 'name profilePhoto')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    res.json({ totalPages, verifiedPages, pendingVerification, categories, recentPages });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllPages = async (req, res) => {
  try {
    const { verified, category, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (verified !== undefined) filter.isVerified = verified === 'true';
    if (category) filter.category = category;

    const [pages, total] = await Promise.all([
      Page.find(filter)
        .populate('creator', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Page.countDocuments(filter),
    ]);

    res.json({ pages, total, pages_count: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyPage = async (req, res) => {
  try {
    const page = await Page.findByIdAndUpdate(
      req.params.pageId,
      { isVerified: true },
      { new: true }
    ).populate('creator', 'name');
    if (!page) return res.status(404).json({ message: 'Page not found' });

    await Notification.create({
      recipient: page.creator._id,
      type: 'system',
      message: `Your page "${page.name}" has been verified`,
    });

    res.json({ page });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.unverifyPage = async (req, res) => {
  try {
    const page = await Page.findByIdAndUpdate(
      req.params.pageId,
      { isVerified: false },
      { new: true }
    );
    if (!page) return res.status(404).json({ message: 'Page not found' });

    await Notification.create({
      recipient: page.creator,
      type: 'system',
      message: `Your page "${page.name}" verification has been revoked`,
    });

    res.json({ page });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removePage = async (req, res) => {
  try {
    const page = await Page.findByIdAndDelete(req.params.pageId);
    if (!page) return res.status(404).json({ message: 'Page not found' });

    await Notification.create({
      recipient: page.creator,
      type: 'system',
      message: `Your page "${page.name}" has been removed`,
    });

    res.json({ message: 'Page removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== EVENT MODERATION ==========

exports.getEventDashboard = async (req, res) => {
  try {
    const now = new Date();
    const [totalEvents, upcomingEvents, pastEvents, recentEvents] = await Promise.all([
      Event.countDocuments(),
      Event.countDocuments({ startDate: { $gte: now } }),
      Event.countDocuments({ startDate: { $lt: now } }),
      Event.find()
        .populate('creator', 'name profilePhoto')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    res.json({ totalEvents, upcomingEvents, pastEvents, recentEvents });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllEvents = async (req, res) => {
  try {
    const { visibility, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (visibility) filter.visibility = visibility;

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('creator', 'name email')
        .sort({ startDate: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Event.countDocuments(filter),
    ]);

    res.json({ events, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    await Notification.create({
      recipient: event.creator,
      type: 'system',
      message: `Your event "${event.title}" has been removed for policy violation`,
    });

    res.json({ message: 'Event removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.flagEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Create a report for the event
    await Report.create({
      reporter: req.user._id,
      targetType: 'event',
      targetId: event._id,
      reason: req.body.reason || 'other',
      description: req.body.description || 'Flagged by admin',
      status: 'pending',
    });

    res.json({ message: 'Event flagged for review' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== COMMUNITY GUIDELINE VIOLATIONS ==========

exports.getViolationDashboard = async (req, res) => {
  try {
    const [totalViolations, activeViolations, recentViolations, byGuideline] = await Promise.all([
      GuidelineViolation.countDocuments(),
      GuidelineViolation.countDocuments({ status: 'active' }),
      GuidelineViolation.find()
        .populate('user', 'name email')
        .populate('issuedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(10),
      GuidelineViolation.aggregate([
        { $group: { _id: '$guideline', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.json({ totalViolations, activeViolations, recentViolations, byGuideline });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllViolations = async (req, res) => {
  try {
    const { status, guideline, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (guideline) filter.guideline = guideline;

    const [violations, total] = await Promise.all([
      GuidelineViolation.find(filter)
        .populate('user', 'name email')
        .populate('issuedBy', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      GuidelineViolation.countDocuments(filter),
    ]);

    res.json({ violations, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.issueViolation = async (req, res) => {
  try {
    const { userId, targetType, targetId, guideline, description, action, expiresAt } = req.body;

    const violation = await GuidelineViolation.create({
      user: userId,
      targetType,
      targetId,
      guideline,
      description: description || '',
      action: action || 'warning',
      issuedBy: req.user._id,
      expiresAt: expiresAt || undefined,
    });

    await Notification.create({
      recipient: userId,
      type: 'system',
      message: `Community guideline violation: ${guideline}. Action: ${action}`,
    });

    res.status(201).json({ violation });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.revokeViolation = async (req, res) => {
  try {
    const violation = await GuidelineViolation.findByIdAndUpdate(
      req.params.violationId,
      { status: 'revoked' },
      { new: true }
    );
    if (!violation) return res.status(404).json({ message: 'Violation not found' });
    res.json({ violation });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== AUTO-MODERATION RULES ==========

exports.getAutoModRules = async (req, res) => {
  try {
    const rules = await AutoModRule.find().sort({ createdAt: -1 });
    res.json({ rules });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createAutoModRule = async (req, res) => {
  try {
    const { name, action, targetType, conditions } = req.body;
    const rule = await AutoModRule.create({
      name,
      action,
      targetType: targetType || 'all',
      conditions: conditions || {},
      createdBy: req.user._id,
    });
    res.status(201).json({ rule });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateAutoModRule = async (req, res) => {
  try {
    const { name, action, targetType, conditions, isActive } = req.body;
    const rule = await AutoModRule.findByIdAndUpdate(
      req.params.ruleId,
      { name, action, targetType, conditions, isActive },
      { new: true }
    );
    if (!rule) return res.status(404).json({ message: 'Rule not found' });
    res.json({ rule });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteAutoModRule = async (req, res) => {
  try {
    const rule = await AutoModRule.findByIdAndDelete(req.params.ruleId);
    if (!rule) return res.status(404).json({ message: 'Rule not found' });
    res.json({ message: 'Rule deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleAutoModRule = async (req, res) => {
  try {
    const rule = await AutoModRule.findById(req.params.ruleId);
    if (!rule) return res.status(404).json({ message: 'Rule not found' });
    rule.isActive = !rule.isActive;
    await rule.save();
    res.json({ rule });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== KEYWORD BLACKLIST ==========

exports.getKeywords = async (req, res) => {
  try {
    const keywords = await KeywordBlacklist.find().sort({ createdAt: -1 });
    res.json({ keywords, total: keywords.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addKeyword = async (req, res) => {
  try {
    const { keyword, category, severity, action, replacement } = req.body;
    const existing = await KeywordBlacklist.findOne({ keyword: keyword.toLowerCase() });
    if (existing) return res.status(400).json({ message: 'Keyword already exists' });

    const kw = await KeywordBlacklist.create({
      keyword,
      category: category || 'custom',
      severity: severity || 'medium',
      action: action || 'flag',
      replacement: replacement || '***',
      createdBy: req.user._id,
    });
    res.status(201).json({ keyword: kw });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addBulkKeywords = async (req, res) => {
  try {
    const { keywords, category, severity, action } = req.body;
    if (!Array.isArray(keywords)) return res.status(400).json({ message: 'Keywords must be an array' });

    const results = [];
    for (const kw of keywords) {
      const existing = await KeywordBlacklist.findOne({ keyword: kw.toLowerCase() });
      if (!existing) {
        results.push(await KeywordBlacklist.create({
          keyword: kw,
          category: category || 'custom',
          severity: severity || 'medium',
          action: action || 'flag',
          createdBy: req.user._id,
        }));
      }
    }

    res.status(201).json({ added: results.length, total: keywords.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateKeyword = async (req, res) => {
  try {
    const { keyword, category, severity, action, replacement, isActive } = req.body;
    const kw = await KeywordBlacklist.findByIdAndUpdate(
      req.params.keywordId,
      { keyword, category, severity, action, replacement, isActive },
      { new: true }
    );
    if (!kw) return res.status(404).json({ message: 'Keyword not found' });
    res.json({ keyword: kw });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteKeyword = async (req, res) => {
  try {
    const kw = await KeywordBlacklist.findByIdAndDelete(req.params.keywordId);
    if (!kw) return res.status(404).json({ message: 'Keyword not found' });
    res.json({ message: 'Keyword deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleKeyword = async (req, res) => {
  try {
    const kw = await KeywordBlacklist.findById(req.params.keywordId);
    if (!kw) return res.status(404).json({ message: 'Keyword not found' });
    kw.isActive = !kw.isActive;
    await kw.save();
    res.json({ keyword: kw });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== LINK BLACKLIST ==========

exports.getLinks = async (req, res) => {
  try {
    const links = await LinkBlacklist.find().sort({ createdAt: -1 });
    res.json({ links, total: links.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addLink = async (req, res) => {
  try {
    const { domain, reason, severity } = req.body;
    const existing = await LinkBlacklist.findOne({ domain: domain.toLowerCase() });
    if (existing) return res.status(400).json({ message: 'Domain already exists' });

    const link = await LinkBlacklist.create({
      domain,
      reason: reason || '',
      severity: severity || 'medium',
      createdBy: req.user._id,
    });
    res.status(201).json({ link });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addBulkLinks = async (req, res) => {
  try {
    const { domains, reason, severity } = req.body;
    if (!Array.isArray(domains)) return res.status(400).json({ message: 'Domains must be an array' });

    const results = [];
    for (const d of domains) {
      const existing = await LinkBlacklist.findOne({ domain: d.toLowerCase() });
      if (!existing) {
        results.push(await LinkBlacklist.create({
          domain: d,
          reason: reason || '',
          severity: severity || 'medium',
          createdBy: req.user._id,
        }));
      }
    }

    res.status(201).json({ added: results.length, total: domains.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateLink = async (req, res) => {
  try {
    const { domain, reason, severity, isActive } = req.body;
    const link = await LinkBlacklist.findByIdAndUpdate(
      req.params.linkId,
      { domain, reason, severity, isActive },
      { new: true }
    );
    if (!link) return res.status(404).json({ message: 'Link not found' });
    res.json({ link });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteLink = async (req, res) => {
  try {
    const link = await LinkBlacklist.findByIdAndDelete(req.params.linkId);
    if (!link) return res.status(404).json({ message: 'Link not found' });
    res.json({ message: 'Link deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleLink = async (req, res) => {
  try {
    const link = await LinkBlacklist.findById(req.params.linkId);
    if (!link) return res.status(404).json({ message: 'Link not found' });
    link.isActive = !link.isActive;
    await link.save();
    res.json({ link });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== MEDIA UPLOAD RESTRICTIONS ==========

exports.getMediaRestrictions = async (req, res) => {
  try {
    const restrictions = await MediaRestriction.find().sort({ createdAt: -1 });
    res.json({ restrictions, total: restrictions.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addMediaRestriction = async (req, res) => {
  try {
    const { name, type, config, appliesTo, action } = req.body;
    const restriction = await MediaRestriction.create({
      name,
      type,
      config: config || {},
      appliesTo: appliesTo || 'all',
      action: action || 'block',
      createdBy: req.user._id,
    });
    res.status(201).json({ restriction });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateMediaRestriction = async (req, res) => {
  try {
    const { name, type, config, appliesTo, action, isActive } = req.body;
    const restriction = await MediaRestriction.findByIdAndUpdate(
      req.params.restrictionId,
      { name, type, config, appliesTo, action, isActive },
      { new: true }
    );
    if (!restriction) return res.status(404).json({ message: 'Restriction not found' });
    res.json({ restriction });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteMediaRestriction = async (req, res) => {
  try {
    const restriction = await MediaRestriction.findByIdAndDelete(req.params.restrictionId);
    if (!restriction) return res.status(404).json({ message: 'Restriction not found' });
    res.json({ message: 'Restriction deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleMediaRestriction = async (req, res) => {
  try {
    const restriction = await MediaRestriction.findById(req.params.restrictionId);
    if (!restriction) return res.status(404).json({ message: 'Restriction not found' });
    restriction.isActive = !restriction.isActive;
    await restriction.save();
    res.json({ restriction });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
