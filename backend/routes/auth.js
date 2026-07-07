const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  loginVerify2FA,
  logout,
  getMe,
  getSocketToken,
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
const { verifyTurnstile } = require('../middleware/verifyTurnstile');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/signup', authLimiter, verifyTurnstile, signup);
router.post('/login', authLimiter, verifyTurnstile, login);
router.post('/login/2fa', authLimiter, loginVerify2FA);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.get('/socket-token', protect, getSocketToken);
router.put('/change-password', protect, changePassword);
router.get('/sessions', protect, getSessions);
router.delete('/sessions/:id', protect, revokeSession);
router.delete('/sessions', protect, revokeAllSessions);
router.get('/login-history', protect, getLoginHistory);
router.get('/safety', protect, getSafety);
router.put('/safety', protect, updateSafety);
router.delete('/account', protect, deleteAccount);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.get('/trusted-devices', protect, getTrustedDevices);
router.post('/trusted-devices', protect, trustDevice);
router.delete('/trusted-devices/:deviceId', protect, removeTrustedDevice);

module.exports = router;
