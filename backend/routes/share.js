const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name profilePhoto')
      .populate('sharedPost');

    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.visibility !== 'public') {
      return res.status(403).json({ message: 'Post is not public' });
    }

    res.json({
      post: {
        _id: post._id,
        text: post.text,
        media: post.media,
        author: post.author,
        createdAt: post.createdAt,
        sharedPost: post.sharedPost,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
