const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getUserById,
  getUserPosts,
  getUserOnlineStatus,
  updateProfile,
  updatePrivacy,
  getPrivacy,
  updateStoryHiddenFrom,
  blockUser,
  getBlockedUsers,
  addWork,
  updateWork,
  deleteWork,
  addEducation,
  updateEducation,
  deleteEducation,
  getFollowers,
  getFollowing,
  getFollowerCount,
  toggleFollow,
  pinPost,
  unpinPost,
  getPinnedPost,
  getProfileCompletion,
  getSharedGroupsAndPages,
} = require('../controllers/userController');

router.use(protect);

router.get('/blocked', getBlockedUsers);
router.get('/privacy', getPrivacy);
router.put('/privacy', updatePrivacy);
router.put('/privacy/story-hidden', updateStoryHiddenFrom);
router.post('/block', blockUser);

// Verification request (user-facing) - must be before /:id routes
router.post('/request-verification', async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.verificationRequested = true;
    user.verificationReason = req.body.reason || '';
    await user.save();
    res.json({ message: 'Verification request submitted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Appeal submission (user-facing) - must be before /:id routes
router.post('/appeals', async (req, res) => {
  try {
    const Appeal = require('../models/Appeal');
    const { type, reason } = req.body;
    if (!type || !reason) {
      return res.status(400).json({ message: 'Type and reason are required' });
    }
    if (!['ban', 'suspend', 'warning', 'restriction', 'verification'].includes(type)) {
      return res.status(400).json({ message: 'Invalid appeal type' });
    }
    const appeal = await Appeal.create({
      user: req.user._id,
      type,
      reason,
    });
    res.status(201).json({ message: 'Appeal submitted', appeal });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's own appeals - must be before /:id routes
router.get('/my-appeals', async (req, res) => {
  try {
    const Appeal = require('../models/Appeal');
    const appeals = await Appeal.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ appeals });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Work history CRUD - must be before /:id routes
router.post('/work', addWork);
router.put('/work/:entryId', updateWork);
router.delete('/work/:entryId', deleteWork);

// Education history CRUD - must be before /:id routes
router.post('/education', addEducation);
router.put('/education/:entryId', updateEducation);
router.delete('/education/:entryId', deleteEducation);

// Followers / Following - must be before /:id routes
router.get('/followers-count/:id', getFollowerCount);
router.get('/followers/:id', getFollowers);
router.get('/following/:id', getFollowing);
router.post('/follow/:userId', toggleFollow);

// Pinned Post - must be before /:id routes
router.put('/pin-post/:postId', pinPost);
router.delete('/pin-post', unpinPost);
router.get('/pinned-post/:id', getPinnedPost);

// Profile Completion - must be before /:id routes
router.get('/profile-completion', getProfileCompletion);

// Shared Groups & Pages in Common - must be before /:id routes
router.get('/shared/:id', getSharedGroupsAndPages);

router.get('/:id/online', getUserOnlineStatus);
router.get('/:id/posts', getUserPosts);
router.get('/:id', getUserById);
router.put('/:id', updateProfile);

module.exports = router;
