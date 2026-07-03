const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createRequest,
  createPostHelp,
  getNearby,
  getRequest,
  offerHelp,
  acceptHelper,
  resolveRequest,
  getHelpHistory,
} = require('../controllers/helpController');

router.use(protect);

router.post('/request', createRequest);
router.get('/nearby', getNearby);
router.get('/:id', getRequest);
router.post('/:id/offer', offerHelp);
router.put('/:id/accept/:helperId', acceptHelper);
router.put('/:id/resolve', resolveRequest);

// Post-to-help conversion
router.post('/posts/:id/help', createPostHelp);

// User help history
router.get('/user/:id/history', getHelpHistory);

module.exports = router;
