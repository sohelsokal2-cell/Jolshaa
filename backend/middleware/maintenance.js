const SystemSetting = require('../models/SystemSetting');

let maintenanceEnabled = false;
let maintenanceMessage = 'System under maintenance';

// Load maintenance state on startup
async function loadMaintenanceMode() {
  try {
    const mode = await SystemSetting.findOne({ key: 'maintenance_mode' });
    const msg = await SystemSetting.findOne({ key: 'maintenance_message' });
    maintenanceEnabled = mode?.value ?? false;
    maintenanceMessage = msg?.value ?? 'System under maintenance';
  } catch {}
}

// Called when admin toggles maintenance mode
function setMaintenanceMode(enabled, message) {
  maintenanceEnabled = enabled;
  if (message) maintenanceMessage = message;
}

// Middleware: blocks non-admin users when maintenance mode is on
async function maintenanceCheck(req, res, next) {
  if (!maintenanceEnabled) return next();

  // Allow admin routes, auth routes, and system health
  if (req.path.startsWith('/api/admin') || req.path.startsWith('/api/auth') || req.path === '/api/system/health') {
    return next();
  }

  // Check if user is admin via token (lightweight check)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      const User = require('../models/User');
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('isAdmin role').lean();
      if (user && (user.isAdmin || user.role === 'admin' || user.role === 'superadmin')) {
        return next();
      }
    } catch {}
  }

  return res.status(503).json({
    message: maintenanceMessage,
    maintenance: true,
  });
}

module.exports = { loadMaintenanceMode, setMaintenanceMode, maintenanceCheck };
