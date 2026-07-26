const jwt = require('jsonwebtoken');

/**
 * Return the JWT secret from the environment or a fallback for local dev.
 * IMPORTANT: In production, always set JWT_SECRET to a strong random value.
 */
function getJwtSecret() {
  return process.env.JWT_SECRET || 'dev_secret_change_me';
}

function signToken(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}

module.exports = { signToken, verifyToken, getJwtSecret };

