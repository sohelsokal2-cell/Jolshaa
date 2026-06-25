const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  updateProfile,
  updatePrivacy,
  getPrivacy,
  blockUser,
  getBlockedUsers,
} = require('../controllers/userController');

router.use(protect);

router.put('/:id', updateProfile);
router.get('/privacy', getPrivacy);
router.put('/privacy', updatePrivacy);
router.post('/block', blockUser);
router.get('/blocked', getBlockedUsers);

module.exports = router;
