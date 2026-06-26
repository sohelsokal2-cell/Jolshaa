const perfMetrics = {
  requests: [],
  maxRequests: 10000,
  slowQueries: [],
};

function performanceMonitor(req, res, next) {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000;

    const metric = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      timestamp: Date.now(),
      userId: req.user?._id,
    };

    perfMetrics.requests.push(metric);

    if (perfMetrics.requests.length > perfMetrics.maxRequests) {
      perfMetrics.requests = perfMetrics.requests.slice(-perfMetrics.maxRequests);
    }

    if (duration > 1000) {
      perfMetrics.slowQueries.push(metric);
      if (perfMetrics.slowQueries.length > 100) {
        perfMetrics.slowQueries = perfMetrics.slowQueries.slice(-100);
      }
    }

    if (duration > 2000) {
      console.warn(`[SLOW] ${req.method} ${req.path} took ${duration.toFixed(0)}ms`);
    }
  });

  next();
}

function getPerformanceStats() {
  const now = Date.now();
  const last5min = perfMetrics.requests.filter(r => now - r.timestamp < 300000);
  const last1h = perfMetrics.requests.filter(r => now - r.timestamp < 3600000);

  const avgResponseTime = last5min.length > 0
    ? last5min.reduce((sum, r) => sum + r.duration, 0) / last5min.length
    : 0;

  const errorRate = last5min.length > 0
    ? (last5min.filter(r => r.statusCode >= 400).length / last5min.length * 100).toFixed(2)
    : 0;

  const requestsPerMinute = last5min.length / 5;

  const statusCodes = {};
  last5min.forEach(r => {
    statusCodes[r.statusCode] = (statusCodes[r.statusCode] || 0) + 1;
  });

  const endpointStats = {};
  last1h.forEach(r => {
    const key = `${r.method} ${r.path}`;
    if (!endpointStats[key]) {
      endpointStats[key] = { count: 0, totalDuration: 0, errors: 0 };
    }
    endpointStats[key].count += 1;
    endpointStats[key].totalDuration += r.duration;
    if (r.statusCode >= 400) endpointStats[key].errors += 1;
  });

  Object.keys(endpointStats).forEach(key => {
    endpointStats[key].avgDuration = endpointStats[key].totalDuration / endpointStats[key].count;
  });

  return {
    requestsPerMinute: Math.round(requestsPerMinute),
    avgResponseTime: Math.round(avgResponseTime),
    errorRate: parseFloat(errorRate),
    statusCodes,
    slowQueries: perfMetrics.slowQueries.slice(-10),
    topEndpoints: Object.entries(endpointStats)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([endpoint, stats]) => ({
        endpoint,
        ...stats,
        avgDuration: Math.round(stats.avgDuration),
      })),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  };
}

function getSystemHealth() {
  const mem = process.memoryUsage();
  const health = {
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    memory: {
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      rss: Math.round(mem.rss / 1024 / 1024),
    },
    nodeVersion: process.version,
  };

  if (mem.heapUsed / mem.heapTotal > 0.9) {
    health.status = 'degraded';
  }

  return health;
}

module.exports = { performanceMonitor, getPerformanceStats, getSystemHealth };
