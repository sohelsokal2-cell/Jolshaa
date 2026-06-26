const Poll = require('../models/Poll');

exports.createPoll = async (req, res) => {
  try {
    const { postId, question, options, expiresIn } = req.body;

    if (!postId || !question || !options || options.length < 2) {
      return res.status(400).json({ message: 'Post ID, question, and at least 2 options are required' });
    }

    if (options.length > 10) {
      return res.status(400).json({ message: 'Maximum 10 options allowed' });
    }

    const expiresAt = expiresIn
      ? new Date(Date.now() + parseInt(expiresIn) * 3600000)
      : null;

    const poll = await Poll.create({
      post: postId,
      question,
      options: options.map((text) => ({ text, voters: [] })),
      expiresAt,
    });

    res.status(201).json({ poll });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPoll = async (req, res) => {
  try {
    const poll = await Poll.findOne({ post: req.params.postId })
      .populate('options.voters', 'name profilePhoto');

    if (!poll) return res.status(404).json({ message: 'Poll not found' });

    const isExpired = poll.expiresAt && new Date() > poll.expiresAt;
    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voters.length, 0);

    const options = poll.options.map((opt) => ({
      text: opt.text,
      voteCount: opt.voters.length,
      percentage: totalVotes > 0 ? Math.round((opt.voters.length / totalVotes) * 100) : 0,
      hasVoted: opt.voters.some((v) => v._id.toString() === req.user._id.toString()),
    }));

    res.json({
      poll: {
        _id: poll._id,
        question: poll.question,
        options,
        totalVotes,
        isExpired,
        expiresAt: poll.expiresAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.vote = async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const poll = await Poll.findOne({ post: req.params.postId });

    if (!poll) return res.status(404).json({ message: 'Poll not found' });

    const isExpired = poll.expiresAt && new Date() > poll.expiresAt;
    if (isExpired) return res.status(400).json({ message: 'Poll has expired' });

    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ message: 'Invalid option index' });
    }

    poll.options.forEach((opt) => {
      opt.voters = opt.voters.filter(
        (v) => v.toString() !== req.user._id.toString()
      );
    });

    poll.options[optionIndex].voters.push(req.user._id);
    await poll.save();

    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voters.length, 0);

    const options = poll.options.map((opt) => ({
      text: opt.text,
      voteCount: opt.voters.length,
      percentage: totalVotes > 0 ? Math.round((opt.voters.length / totalVotes) * 100) : 0,
      hasVoted: opt.voters.some((v) => v.toString() === req.user._id.toString()),
    }));

    res.json({ poll: { options, totalVotes } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
