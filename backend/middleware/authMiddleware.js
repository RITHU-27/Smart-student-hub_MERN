const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

/**
 * 🧩 Authenticate user from "Authorization: Bearer <token>"
 */
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch user details
    const user = await User.findById(decoded.id || decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid token: user not found' });
    }

    // Attach user info to req
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role?.toLowerCase();

    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({ message: 'Unauthorized', error: error.message });
  }
};

/**
 * 🧱 Authorize specific roles (supports multiple)
 */
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    const roles = Array.isArray(allowedRoles[0]) ? allowedRoles[0] : allowedRoles;
    const role = req.userRole?.toLowerCase();

    if (!req.user || !role) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!roles.map(r => r.toLowerCase()).includes(role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

/**
 * 🧩 Authorize self (student) or privileged roles (faculty/admin)
 * Works for both :id and :studentId params
 */
const authorizeSelfOrRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      const resourceId = req.params.id || req.params.studentId;
      const roles = Array.isArray(allowedRoles[0]) ? allowedRoles[0] : allowedRoles;
      const role = req.userRole?.toLowerCase();

      if (!req.user || !role) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      // ✅ Privileged roles always allowed
      if (roles.map(r => r.toLowerCase()).includes(role)) {
        return next();
      }

      // ✅ Students can access their own resources
      if (req.user._id.toString() === resourceId) {
        return next();
      }

      // 🚫 Otherwise block
      return res.status(403).json({
        message: 'Access denied. You can only access your own data.',
      });
    } catch (err) {
      console.error('Authorization error:', err);
      res.status(500).json({ message: 'Server authorization error' });
    }
  };
};

module.exports = { authenticateUser, authorizeRole, authorizeSelfOrRole };
