const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createAlbum,
  getUserAlbums,
  getAlbum,
  addPhotos,
  deleteAlbum,
  removePhoto,
  updateAlbum,
  shareAlbum,
  getHighlights,
} = require('../controllers/albumController');

router.use(protect);

router.post('/', createAlbum);
router.get('/user/:userId', getUserAlbums);
router.get('/highlights/:userId', getHighlights);
router.get('/:id', getAlbum);
router.put('/:id', updateAlbum);
router.put('/:id/photos', upload.array('photos', 20), upload.checkMediaSize, addPhotos);
router.put('/:id/share', shareAlbum);
router.delete('/:id', deleteAlbum);
router.put('/:id/remove-photo', removePhoto);

module.exports = router;
