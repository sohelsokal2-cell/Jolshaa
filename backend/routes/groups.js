const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkRestriction } = require('../middleware/checkRestriction');
const upload = require('../middleware/upload');
const {
  createGroup,
  getGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  joinGroup,
  approveRequest,
  leaveGroup,
  removeMember,
  getMembers,
  addModerator,
  removeModerator,
  pinPost,
  updateRules,
  getGroupFeed,
  createGroupPost
} = require('../controllers/groupController');

router.use(protect);

router.post('/', upload.single('coverPhoto'), createGroup);
router.get('/', getGroups);
router.get('/:id', getGroup);
router.put('/:id', upload.single('coverPhoto'), updateGroup);
router.delete('/:id', deleteGroup);
router.put('/:id/join', checkRestriction('group_join'), joinGroup);
router.put('/:id/approve/:userId', approveRequest);
router.put('/:id/leave', leaveGroup);
router.delete('/:id/remove/:userId', removeMember);
router.get('/:id/members', getMembers);
router.put('/:id/moderator/:userId', addModerator);
router.delete('/:id/moderator/:userId', removeModerator);
router.put('/:id/pin/:postId', pinPost);
router.put('/:id/rules', updateRules);
router.get('/:id/feed', getGroupFeed);
router.post('/:id/posts', upload.array('media', 5), createGroupPost);

module.exports = router;
