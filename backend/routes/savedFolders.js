const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createFolder,
  getFolders,
  updateFolder,
  deleteFolder,
  addToFolder,
  removeFromFolder,
} = require('../controllers/savedFolderController');

router.use(protect);

router.post('/', createFolder);
router.get('/', getFolders);
router.put('/:id', updateFolder);
router.delete('/:id', deleteFolder);
router.post('/:id/add', addToFolder);
router.delete('/:folderId/post/:postId', removeFromFolder);

module.exports = router;
