const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getHashtagPage,
  getTrendingHashtags,
  createCheckin,
  getUserCheckins,
  getLocationCheckins,
  getNearbyLocations,
  deleteCheckin,
} = require('../controllers/hashtagLocationController');

router.use(protect);

router.get('/hashtags/trending', getTrendingHashtags);
router.get('/hashtags/:name', getHashtagPage);
router.post('/checkins', createCheckin);
router.get('/checkins/user/:userId', getUserCheckins);
router.get('/checkins/location/:locationName', getLocationCheckins);
router.get('/checkins/nearby', getNearbyLocations);
router.delete('/checkins/:id', deleteCheckin);

module.exports = router;
