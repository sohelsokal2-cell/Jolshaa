const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { initSocket } = require('./socket');

dotenv.config();

connectDB();

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

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/pages', require('./routes/pages'));
app.use('/api/stories', require('./routes/stories'));
app.use('/api/albums', require('./routes/albums'));
app.use('/api/search', require('./routes/search'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/admin', require('./routes/admin'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
