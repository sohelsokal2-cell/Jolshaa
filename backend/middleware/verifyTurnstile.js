const axios = require('axios');

const verifyTurnstile = async (req, res, next) => {
  const token = req.body.turnstileToken;

  if (!token) {
    return res.status(400).json({ message: 'Captcha verification required' });
  }

  try {
    const response = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: req.ip || req.connection?.remoteAddress || ''
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    if (!response.data.success) {
      return res.status(403).json({ message: 'Captcha verification failed' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Captcha verification error' });
  }
};

module.exports = { verifyTurnstile };
