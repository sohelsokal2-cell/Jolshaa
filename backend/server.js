const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { initSocket } = require('./socket');
const { authLimiter, postLimiter, commentLimiter, reportLimiter, messageLimiter, generalLimiter } = require('./middleware/rateLimiter');
const { performanceMonitor } = require('./services/performanceMonitor');
const { errorHandler } = require('./services/errorMonitor');
const { startBackgroundJobs } = require('./services/backgroundJobs');
const { initRedis } = require('./services/cache');
const { loadMaintenanceMode, maintenanceCheck } = require('./middleware/maintenance');

dotenv.config();

connectDB().then(() => {
  initRedis();
  startBackgroundJobs();
  loadMaintenanceMode();
});

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');

const allowedOrigins = [
  CLIENT_URL,
  'https://jolshaa.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean).map(o => o.replace(/\/$/, ''));

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(generalLimiter);
app.use(performanceMonitor);
app.use(maintenanceCheck);

app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', postLimiter, require('./routes/posts'));
app.use('/api/comments', commentLimiter, require('./routes/comments'));
app.use('/api/conversations', messageLimiter, require('./routes/conversations'));
app.use('/api/messages', messageLimiter, require('./routes/messages'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/pages', require('./routes/pages'));
app.use('/api/stories', require('./routes/stories'));
app.use('/api/albums', require('./routes/albums'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/events', require('./routes/events'));
app.use('/api/reels', require('./routes/reels'));
app.use('/api/search', require('./routes/search'));
app.use('/api/suggestions', require('./routes/suggestions'));
app.use('/api/polls', require('./routes/polls'));
app.use('/api/qa', require('./routes/qa'));
app.use('/api/creator', require('./routes/creator'));
app.use('/api/boost', require('./routes/boost'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/tips', require('./routes/tips'));
app.use('/api/ads', require('./routes/ads'));
app.use('/api/marketplace', require('./routes/marketplace'));
app.use('/api/reports', reportLimiter, require('./routes/reports'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/share', require('./routes/share'));
app.use('/api/system', require('./routes/system'));
app.use('/api/scheduler', require('./routes/scheduler'));
app.use('/api/privacy', require('./routes/privacy'));
app.use('/api/hashtags', require('./routes/hashtagLocation'));
app.use('/api/topics', require('./routes/topics'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/notification-preferences', require('./routes/notificationPreferences'));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
