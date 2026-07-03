const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  logout,
  getMe,
  changePassword,
  getSessions,
  revokeSession,
  revokeAllSessions,
  getLoginHistory,
  getSafety,
  updateSafety,
  deleteAccount,
  forgotPassword,
  resetPassword,
  getTrustedDevices,
  trustDevice,
  removeTrustedDevice
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.get('/sessions', protect, getSessions);
router.delete('/sessions/:id', protect, revokeSession);
router.delete('/sessions', protect, revokeAllSessions);
router.get('/login-history', protect, getLoginHistory);
router.get('/safety', protect, getSafety);
router.put('/safety', protect, updateSafety);
router.delete('/account', protect, deleteAccount);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/trusted-devices', protect, getTrustedDevices);
router.post('/trusted-devices', protect, trustDevice);
router.delete('/trusted-devices/:deviceId', protect, removeTrustedDevice);

module.exports = router;
