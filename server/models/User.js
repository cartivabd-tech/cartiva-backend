const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, index: true, required: true },
    passwordHash: { type: String, default: '' },
    googleId: { type: String, default: '' },
    name: { type: String, default: '' },
    picture: { type: String, default: '' },
    authProvider: { type: String, default: 'password' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
