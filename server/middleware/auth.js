const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const { getJwtSecret } = require('../utils/jwt');

function getSecret() {
  return getJwtSecret();
}

function authRequired(role) {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      const payload = jwt.verify(token, getSecret());
      if (!payload) return res.status(403).json({ error: 'Forbidden' });

      // Accept both 'customer' (old) and 'user' (new) roles for customer middleware
      const allowedRoles = role === 'admin' ? ['admin'] : ['customer', 'user'];
      if (!allowedRoles.includes(payload.role)) return res.status(403).json({ error: 'Forbidden' });

      if (role === 'admin') {
        const admin = await Admin.findById(payload.sub);
        if (!admin) return res.status(401).json({ error: 'Unauthorized' });
        req.user = { username: admin.username, id: admin._id.toString() };
      }

      if (role === 'customer' || role === 'user') {
        // Support both old (sub) and new (id) JWT payload formats
        const userId = payload.id || payload.sub;
        const user = await User.findById(userId);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        req.user = { email: user.email, id: user._id.toString(), role: user.role };
      }

      next();
    } catch {
      res.status(401).json({ error: 'Unauthorized' });
    }
  };
}

const authAdmin = authRequired('admin');
const authCustomer = authRequired('customer');

module.exports = { authAdmin, authCustomer };

