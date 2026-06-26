let redisClient = null;
let redisAvailable = false;

const CACHE_TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 3600,
  DAY: 86400,
};

const CACHE_KEYS = {
  USER_PROFILE: 'user:profile:',
  POST_FEED: 'feed:',
  POST_DETAIL: 'post:detail:',
  STORY_FEED: 'stories:',
  NOTIFICATIONS: 'notifications:',
  ONLINE_USERS: 'online:',
  TRENDING_POSTS: 'trending:posts',
  TRENDING_HASHTAGS: 'trending:hashtags',
  SUGGESTED_GROUPS: 'suggested:groups:',
  SUGGESTED_PAGES: 'suggested:pages:',
  SEARCH_RESULTS: 'search:',
  RATE_LIMIT: 'ratelimit:',
};

async function initRedis() {
  try {
    if (process.env.REDIS_URL) {
      const { createClient } = require('redis');
      redisClient = createClient({
        url: process.env.REDIS_URL,
        socket: { connectTimeout: 5000 },
      });

      redisClient.on('error', () => { redisAvailable = false; });
      redisClient.on('connect', () => { redisAvailable = true; });

      await redisClient.connect();
      console.log('Redis connected');
      return true;
    }
  } catch (err) {
    console.log('Redis not available, using memory cache');
  }

  redisClient = null;
  redisAvailable = false;
  return false;
}

const memoryCache = new Map();

function getMemoryCache(key) {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return item.value;
}

function setMemoryCache(key, value, ttl) {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttl * 1000,
  });

  if (memoryCache.size > 1000) {
    const oldest = memoryCache.keys().next().value;
    memoryCache.delete(oldest);
  }
}

async function cacheGet(key) {
  if (redisAvailable && redisClient) {
    try {
      const val = await redisClient.get(key);
      return val ? JSON.parse(val) : null;
    } catch { return null; }
  }
  return getMemoryCache(key);
}

async function cacheSet(key, value, ttl = CACHE_TTL.MEDIUM) {
  if (redisAvailable && redisClient) {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch { return false; }
  }
  setMemoryCache(key, value, ttl);
  return true;
}

async function cacheDel(key) {
  if (redisAvailable && redisClient) {
    try {
      await redisClient.del(key);
    } catch {}
  }
  memoryCache.delete(key);
}

async function cacheDelPattern(pattern) {
  if (redisAvailable && redisClient) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) await redisClient.del(keys);
    } catch {}
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(pattern.replace('*', ''))) {
      memoryCache.delete(key);
    }
  }
}

module.exports = {
  initRedis,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheDelPattern,
  CACHE_TTL,
  CACHE_KEYS,
  isRedisAvailable: () => redisAvailable,
};
