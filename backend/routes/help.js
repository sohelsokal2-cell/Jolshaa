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
router.post('/posts/:id/help', createPostHelp);
router.get('/user/:id/history', getHelpHistory);
router.get('/:id', getRequest);
router.post('/:id/offer', offerHelp);
router.put('/:id/accept/:helperId', acceptHelper);
router.put('/:id/resolve', resolveRequest);

module.exports = router;
