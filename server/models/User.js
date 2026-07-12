const mongoose = require('mongoose');

// Supports both password auth and Google Sign-In.
const UserSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, index: true, required: true },

    // Password auth fields (optional if user signs up via Google)
    passwordHash: { type: String, default: null },

    // Google auth fields
    googleId: { type: String, default: null, index: true },
    name: { type: String, default: '' },
    picture: { type: String, default: '' },
    authProvider: { type: String, default: 'password' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);


