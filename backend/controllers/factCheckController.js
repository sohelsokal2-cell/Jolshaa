const Post = require('../models/Post');
const FactCheckReport = require('../models/FactCheckReport');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { getIO } = require('../socket');

const VOTE_TYPES = ['true', 'false', 'misleading'];

const calculateWeightedVote = (user) => {
  if (!user || !user.createdAt) return 1;
  const accountAgeMs = Date.now() - new Date(user.createdAt).getTime();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  return accountAgeMs < sevenDaysMs ? 0.5 : 1;
};

const recalculateStatus = (factCheck) => {
  const { trueVotes, falseVotes, misleadingVotes, totalVotes } = factCheck;
  if (totalVotes < 10) return 'unverified';

  const trueWeighted = trueVotes.length;
  const falseWeighted = falseVotes.length;
  const misleadingWeighted = misleadingVotes.length;

  if (falseWeighted > totalVotes * 0.6) return 'false';
  if (trueWeighted > totalVotes * 0.6) return 'true';
  if (misleadingWeighted > totalVotes * 0.4) return 'misleading';
  return 'unverified';
};

const getVoteDistribution = (factCheck) => {
  const total = factCheck.totalVotes || 0;
  if (total === 0) return { true: 0, false: 0, misleading: 0 };
  return {
    true: Math.round((factCheck.trueVotes.length / total) * 100),
    false: Math.round((factCheck.falseVotes.length / total) * 100),
    misleading: Math.round((factCheck.misleadingVotes.length / total) * 100),
  };
};

const notifyAdmins = async (post, status) => {
  try {
    const admins = await User.find({ isAdmin: true }).select('_id');
    const io = getIO();
    for (const admin of admins) {
      const notification = await Notification.create({
        recipient: admin._id,
        sender: post.author,
        type: 'system',
        relatedPost: post._id,
      });
      io.to(`user:${admin._id}`).emit('newNotification', {
        ...notification.toObject(),
        sender: { _id: post.author, name: 'System' },
        meta: { factCheckFlag: true, postStatus: status }
      });
    }
  } catch (err) {
    console.error('Failed to notify admins:', err);
  }
};

exports.vote = async (req, res) => {
  try {
    const { id } = req.params;
    const { vote } = req.body;

    if (!VOTE_TYPES.includes(vote)) {
      return res.status(400).json({ message: 'Invalid vote type. Use: true, false, or misleading' });
    }

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.author.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot vote on your own post' });
    }

    if (!post.factCheck) {
      post.factCheck = { status: 'unverified', totalVotes: 0 };
    }

    const fc = post.factCheck;
    const userId = req.user._id;
    const voteField = `${vote}Votes`;

    // Remove from any previous vote arrays
    fc.trueVotes = fc.trueVotes.filter(uid => uid.toString() !== userId.toString());
    fc.falseVotes = fc.falseVotes.filter(uid => uid.toString() !== userId.toString());
    fc.misleadingVotes = fc.misleadingVotes.filter(uid => uid.toString() !== userId.toString());

    // Check if user already voted the same way (toggle off)
    const alreadyVoted = fc[voteField].some(uid => uid.toString() === userId.toString());
    if (alreadyVoted) {
      fc.totalVotes = Math.max(0, fc.totalVotes - 1);
    } else {
      fc[voteField].push(userId);
      fc.totalVotes += 1;
    }

    // Recalculate status
    fc.status = recalculateStatus(fc);

    // Flag for admin review if community判定 is false or misleading
    if (fc.status === 'false' || fc.status === 'misleading') {
      fc.flaggedForReview = true;
      notifyAdmins(post, fc.status);
    }

    await post.save();

    res.json({
      message: alreadyVoted ? 'Vote removed' : 'Vote recorded',
      factCheck: {
        status: fc.status,
        totalVotes: fc.totalVotes,
        distribution: getVoteDistribution(fc),
        flaggedForReview: fc.flaggedForReview,
        adminVerdict: fc.adminVerdict,
      },
      userVote: alreadyVoted ? null : vote,
    });
  } catch (error) {
    console.error('Fact-check vote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.report = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Please provide a reason' });
    }

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.author.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot report your own post' });
    }

    const existingReport = await FactCheckReport.findOne({
      post: id,
      reporter: req.user._id,
    });

    if (existingReport) {
      existingReport.reason = reason.trim();
      await existingReport.save();
      return res.json({ message: 'Report updated', report: existingReport });
    }

    const report = await FactCheckReport.create({
      post: id,
      reporter: req.user._id,
      reason: reason.trim(),
    });

    res.status(201).json({ message: 'Report submitted', report });
  } catch (error) {
    console.error('Fact-check report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id).select('factCheck author');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const fc = post.factCheck || { status: 'unverified', totalVotes: 0 };
    const reports = await FactCheckReport.find({ post: id })
      .populate('reporter', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .limit(10);

    const userVote = (() => {
      if (fc.trueVotes?.some(uid => uid.toString() === req.user._id.toString())) return 'true';
      if (fc.falseVotes?.some(uid => uid.toString() === req.user._id.toString())) return 'false';
      if (fc.misleadingVotes?.some(uid => uid.toString() === req.user._id.toString())) return 'misleading';
      return null;
    })();

    res.json({
      status: fc.status,
      totalVotes: fc.totalVotes,
      distribution: getVoteDistribution(fc),
      counts: {
        true: fc.trueVotes?.length || 0,
        false: fc.falseVotes?.length || 0,
        misleading: fc.misleadingVotes?.length || 0,
      },
      adminVerdict: fc.adminVerdict || null,
      adminNote: fc.adminNote || '',
      verifiedByAdmin: fc.verifiedByAdmin || false,
      flaggedForReview: fc.flaggedForReview || false,
      userVote,
      reports,
      reportCount: reports.length,
    });
  } catch (error) {
    console.error('Fact-check stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.adminVerdict = async (req, res) => {
  try {
    const { id } = req.params;
    const { verdict, note } = req.body;

    if (!verdict || !['true', 'false', 'misleading'].includes(verdict)) {
      return res.status(400).json({ message: 'Invalid verdict. Use: true, false, or misleading' });
    }

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (!post.factCheck) {
      post.factCheck = { status: 'unverified', totalVotes: 0 };
    }

    post.factCheck.adminVerdict = verdict;
    post.factCheck.adminNote = note || '';
    post.factCheck.verifiedByAdmin = true;
    post.factCheck.flaggedForReview = false;

    await post.save();

    // Notify post author
    try {
      const notification = await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: 'system',
        relatedPost: post._id,
      });
      getIO().to(`user:${post.author}`).emit('newNotification', {
        ...notification.toObject(),
        sender: { _id: req.user._id, name: req.user.name, profilePhoto: req.user.profilePhoto },
        meta: { factCheckVerdict: true, verdict, note: note || '' }
      });
    } catch (err) {
      console.error('Failed to notify post author:', err);
    }

    res.json({
      message: 'Admin verdict recorded',
      factCheck: {
        status: post.factCheck.status,
        adminVerdict: verdict,
        adminNote: note || '',
        verifiedByAdmin: true,
      },
    });
  } catch (error) {
    console.error('Admin verdict error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFlaggedPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ 'factCheck.flaggedForReview': true })
      .sort({ 'factCheck.totalVotes': -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name profilePhoto')
      .select('text media factCheck createdAt');

    const total = await Post.countDocuments({ 'factCheck.flaggedForReview': true });

    const postsWithReports = await Promise.all(
      posts.map(async (post) => {
        const reports = await FactCheckReport.find({ post: post._id })
          .populate('reporter', 'name profilePhoto')
          .sort({ createdAt: -1 })
          .limit(5);
        return { ...post.toObject(), reports };
      })
    );

    res.json({
      posts: postsWithReports,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    console.error('Get flagged posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
