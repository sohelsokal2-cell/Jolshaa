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
} = require('../controllers/albumController');

router.use(protect);

router.post('/', createAlbum);
router.get('/user/:userId', getUserAlbums);
router.get('/:id', getAlbum);
router.put('/:id/photos', upload.array('photos', 20), addPhotos);
router.delete('/:id', deleteAlbum);
router.put('/:id/remove-photo', removePhoto);

module.exports = router;
