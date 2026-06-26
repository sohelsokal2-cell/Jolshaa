const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
});

const postLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: 'Too many posts, please slow down' },
  standardHeaders: true,
  legacyHeaders: false
});

const commentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { message: 'Too many comments, please slow down' },
  standardHeaders: true,
  legacyHeaders: false
});

const reportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: 'Too many reports, please slow down' },
  standardHeaders: true,
  legacyHeaders: false
});

const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { message: 'Too many messages, please slow down' },
  standardHeaders: true,
  legacyHeaders: false
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  authLimiter,
  postLimiter,
  commentLimiter,
  reportLimiter,
  messageLimiter,
  generalLimiter
};
