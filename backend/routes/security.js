const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { get2FAStatus, enable2FA, verify2FA, disable2FA, exportMyData } = require('../controllers/securityController');

router.use(protect);

router.get('/2fa/status', get2FAStatus);
router.post('/2fa/enable', enable2FA);
router.post('/2fa/verify', verify2FA);
router.post('/2fa/disable', disable2FA);
router.get('/export-my-data', exportMyData);

module.exports = router;
