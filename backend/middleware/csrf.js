const crypto = require('crypto');

const CSRF_SECRET = process.env.JWT_SECRET || 'fallback-csrf-secret';
const COOKIE_NAME = '_csrf';
const HEADER_NAME = 'x-csrf-token';

function generateCsrfSecret() {
  return crypto.randomBytes(32).toString('hex');
}

function sign(secret, data) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data);
  return hmac.digest('hex');
}

function generateToken(sessionId) {
  const secret = CSRF_SECRET;
  const payload = `${sessionId}:${Date.now()}`;
  const sig = sign(secret, payload);
  return Buffer.from(`${payload}:${sig}`).toString('base64');
}

function validateToken(token, sessionId) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return false;

    const [tokenSessionId, timestamp, sig] = parts;
    const expectedSig = sign(CSRF_SECRET, `${tokenSessionId}:${timestamp}`);

    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return false;
    if (tokenSessionId !== sessionId) return false;

    // Token valid for 24 hours
    const age = Date.now() - parseInt(timestamp);
    return age < 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

// Double-submit cookie pattern
// Safe because: attacker on another domain can set cookies but can't read them
// via the Fetch API (SameSite cookies prevent sending cross-origin)
function csrfProtection(req, res, next) {
  // Skip safe methods and safe paths
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    // Set CSRF cookie on GET requests if not present
    // Must NOT be httpOnly — JS needs to read it and send as header (double-submit pattern)
    const existingCookie = req.cookies?.[COOKIE_NAME];
    if (!existingCookie) {
      const sessionId = crypto.randomBytes(16).toString('hex');
      const token = generateToken(sessionId);
      res.cookie(COOKIE_NAME, token, {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000,
      });
    }
    return next();
  }

  // For state-changing methods, validate CSRF
  const cookieToken = req.cookies?.[COOKIE_NAME];
  const headerToken = req.headers[HEADER_NAME.toLowerCase()];

  if (!cookieToken || !headerToken) {
    return res.status(403).json({ message: 'CSRF token missing' });
  }

  // Use constant-time comparison
  const a = Buffer.from(cookieToken);
  const b = Buffer.from(headerToken);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(403).json({ message: 'CSRF token mismatch' });
  }

  // Validate the token structure and signature
  try {
    const decoded = Buffer.from(cookieToken, 'base64').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 3) {
      return res.status(403).json({ message: 'Invalid CSRF token' });
    }
    const [sessionId, timestamp, sig] = parts;
    const expectedSig = sign(CSRF_SECRET, `${sessionId}:${timestamp}`);

    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return res.status(403).json({ message: 'Invalid CSRF token' });
    }

    const age = Date.now() - parseInt(timestamp);
    if (age > 24 * 60 * 60 * 1000) {
      return res.status(403).json({ message: 'CSRF token expired' });
    }
  } catch {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }

  next();
}

module.exports = { csrfProtection, generateToken };
