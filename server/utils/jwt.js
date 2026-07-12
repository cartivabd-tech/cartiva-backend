const jwt = require('jsonwebtoken');

function getSecret() {
  return process.env.JWT_SECRET || 'dev_secret_change_me';
}

function signToken(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' });
}

function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

module.exports = { signToken, verifyToken };

