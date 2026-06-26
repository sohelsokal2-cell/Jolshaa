const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createListing,
  getListings,
  getListing,
  updateListing,
  deleteListing,
  markInterested,
  getMyListings,
} = require('../controllers/marketplaceController');

router.get('/', getListings);
router.get('/my', protect, getMyListings);
router.get('/:id', protect, getListing);

router.use(protect);

router.post('/', upload.array('images', 10), createListing);
router.put('/:id', updateListing);
router.delete('/:id', deleteListing);
router.put('/:id/interested', markInterested);

module.exports = router;
