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
} = require('../controllers/userController');

router.use(protect);

router.get('/blocked', getBlockedUsers);
router.get('/privacy', getPrivacy);
router.put('/privacy', updatePrivacy);
router.put('/privacy/story-hidden', updateStoryHiddenFrom);
router.post('/block', blockUser);
router.get('/:id/online', getUserOnlineStatus);
router.get('/:id/posts', getUserPosts);
router.get('/:id', getUserById);
router.put('/:id', updateProfile);

module.exports = router;
