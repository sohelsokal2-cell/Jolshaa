const QA = require('../models/QA');

exports.createQA = async (req, res) => {
  try {
    const { postId, question, isAnonymous } = req.body;

    if (!postId || !question) {
      return res.status(400).json({ message: 'Post ID and question are required' });
    }

    const qa = await QA.create({
      post: postId,
      question,
      isAnonymous: isAnonymous || false,
      answers: [],
    });

    res.status(201).json({ qa });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getQA = async (req, res) => {
  try {
    const qa = await QA.findOne({ post: req.params.postId })
      .populate('answers.user', 'name profilePhoto');

    if (!qa) return res.status(404).json({ message: 'Q&A not found' });

    const answers = qa.answers.map((ans) => ({
      _id: ans._id,
      text: ans.text,
      user: qa.isAnonymous ? null : ans.user,
      isAnonymous: qa.isAnonymous && ans.user._id.toString() !== req.user._id.toString(),
      upvoteCount: ans.upvotes.length,
      hasUpvoted: ans.upvotes.some((v) => v.toString() === req.user._id.toString()),
      createdAt: ans.createdAt,
    }));

    res.json({ qa: { ...qa.toObject(), answers } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addAnswer = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Answer text is required' });

    const qa = await QA.findOne({ post: req.params.postId });
    if (!qa) return res.status(404).json({ message: 'Q&A not found' });

    qa.answers.push({ user: req.user._id, text });
    await qa.save();

    await qa.populate('answers.user', 'name profilePhoto');
    const newAnswer = qa.answers[qa.answers.length - 1];

    res.status(201).json({ answer: newAnswer });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.upvoteAnswer = async (req, res) => {
  try {
    const qa = await QA.findOne({ post: req.params.postId });
    if (!qa) return res.status(404).json({ message: 'Q&A not found' });

    const answer = qa.answers.id(req.params.answerId);
    if (!answer) return res.status(404).json({ message: 'Answer not found' });

    const index = answer.upvotes.findIndex((id) => id.toString() === req.user._id.toString());
    if (index === -1) {
      answer.upvotes.push(req.user._id);
    } else {
      answer.upvotes.splice(index, 1);
    }
    await qa.save();

    res.json({
      upvoteCount: answer.upvotes.length,
      hasUpvoted: index === -1,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteAnswer = async (req, res) => {
  try {
    const qa = await QA.findOne({ post: req.params.postId });
    if (!qa) return res.status(404).json({ message: 'Q&A not found' });

    const answer = qa.answers.id(req.params.answerId);
    if (!answer) return res.status(404).json({ message: 'Answer not found' });

    if (answer.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    qa.answers.pull(req.params.answerId);
    await qa.save();

    res.json({ message: 'Answer deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
