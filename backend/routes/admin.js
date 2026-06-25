const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getUsers,
  suspendUser,
  deleteUser,
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
router.get('/reports', getReports);
router.put('/reports/:id', updateReportStatus);
router.get('/stats', getStats);

module.exports = router;
