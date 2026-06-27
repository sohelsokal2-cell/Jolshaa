const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getCloseFriends, addCloseFriend, removeCloseFriend, isCloseFriend,
  getMutedUsers, muteUser, unmuteUser, isMuted,
  getRestrictedUsers, restrictUser, unrestrictUser, isRestricted,
  updatePrivacy, getPrivacy
} = require('../controllers/privacyController');

router.use(protect);

// Privacy settings
router.get('/settings', getPrivacy);
router.put('/settings', updatePrivacy);

// Close friends
router.get('/close-friends', getCloseFriends);
router.post('/close-friends', addCloseFriend);
router.delete('/close-friends/:userId', removeCloseFriend);
router.get('/close-friends/:userId/check', isCloseFriend);

// Mute
router.get('/muted', getMutedUsers);
router.post('/mute', muteUser);
router.delete('/mute/:userId', unmuteUser);
router.get('/mute/:userId/check', isMuted);

// Restrict
router.get('/restricted', getRestrictedUsers);
router.post('/restrict', restrictUser);
router.delete('/restrict/:userId', unrestrictUser);
router.get('/restrict/:userId/check', isRestricted);

module.exports = router;
