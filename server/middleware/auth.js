const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');

function getSecret() {
  return process.env.JWT_SECRET || 'dev_secret_change_me';
}

function authRequired(role) {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      const payload = jwt.verify(token, getSecret());
      if (!payload || payload.role !== role) return res.status(403).json({ error: 'Forbidden' });

      if (role === 'admin') {
        const admin = await Admin.findById(payload.sub);
        if (!admin) return res.status(401).json({ error: 'Unauthorized' });
        req.user = { username: admin.username, id: admin._id.toString() };
      }

      if (role === 'customer') {
        const user = await User.findById(payload.sub);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        req.user = { email: user.email, id: user._id.toString() };
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

