const { AuditService } = require('./auditLog');

class ErrorMonitor {
  static errors = [];
  static maxErrors = 1000;

  static captureError(error, context = {}) {
    const errorEntry = {
      id: Date.now(),
      message: error.message,
      stack: error.stack,
      code: error.code || 'UNKNOWN',
      context,
      timestamp: new Date(),
    };

    this.errors.push(errorEntry);

    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    AuditService.log({
      action: 'system.error',
      targetType: 'System',
      details: {
        message: error.message,
        stack: error.stack?.substring(0, 500),
        ...context,
      },
    });

    console.error(`[ERROR] ${error.message}`, context);
  }

  static getRecentErrors(limit = 50) {
    return this.errors.slice(-limit).reverse();
  }

  static getErrorStats() {
    const now = Date.now();
    const last24h = this.errors.filter(e => now - e.timestamp.getTime() < 86400000);
    const lastHour = this.errors.filter(e => now - e.timestamp.getTime() < 3600000);

    const byCode = {};
    last24h.forEach(e => {
      byCode[e.code] = (byCode[e.code] || 0) + 1;
    });

    return {
      total: this.errors.length,
      last24h: last24h.length,
      lastHour: lastHour.length,
      byCode,
    };
  }

  static clearOldErrors() {
    const oneDayAgo = Date.now() - 86400000;
    this.errors = this.errors.filter(e => e.timestamp.getTime() > oneDayAgo);
  }
}

const errorHandler = (err, req, res, next) => {
  ErrorMonitor.captureError(err, {
    method: req.method,
    path: req.path,
    userId: req.user?._id,
    ip: req.ip,
  });

  const statusCode = err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';
  res.status(statusCode).json({
    message: isProd && statusCode === 500 ? 'Internal server error' : (err.message || 'Internal server error'),
    ...(!isProd && { stack: err.stack }),
  });
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { ErrorMonitor, errorHandler, asyncHandler };
