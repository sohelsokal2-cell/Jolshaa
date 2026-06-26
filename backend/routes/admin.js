const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getUsers,
  suspendUser,
  deleteUser,
  removePost,
  removeComment,
  removeStory,
  getReports,
  updateReportStatus,
  getStats,
} = require('../controllers/adminController');

const adminOnly = async (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

router.use(protect);
router.use(adminOnly);

router.get('/users', getUsers);
router.put('/users/:id/suspend', suspendUser);
router.delete('/users/:id', deleteUser);
router.delete('/posts/:id', removePost);
router.delete('/comments/:id', removeComment);
router.delete('/stories/:id', removeStory);
router.get('/reports', getReports);
router.put('/reports/:id', updateReportStatus);
router.get('/stats', getStats);
router.put('/pages/:id/verify', async (req, res) => {
  try {
    const Page = require('../models/Page');
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ message: 'Page not found' });
    page.isVerified = !page.isVerified;
    await page.save();
    res.json({ message: page.isVerified ? 'Page verified' : 'Page unverified', isVerified: page.isVerified });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
