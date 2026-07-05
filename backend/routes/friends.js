const express = require('express');
const router = express.Router();
const {
  sendRequest,
  acceptRequest,
  rejectRequest,
  unfriend,
  getFriends,
  getRequests,
  getMutualFriends,
  getSuggested,
  checkStatus
} = require('../controllers/friendController');
const { protect } = require('../middleware/auth');
const { checkRestriction } = require('../middleware/checkRestriction');

router.use(protect);

router.post('/request', checkRestriction('friend_request'), sendRequest);
router.get('/requests', getRequests);
router.get('/suggested', getSuggested);
router.get('/mutual/:userId', getMutualFriends);
router.get('/check/:userId', checkStatus);
router.get('/:userId', getFriends);
router.put('/:id/accept', acceptRequest);
router.put('/:id/reject', rejectRequest);
router.delete('/:userId', unfriend);

module.exports = router;
