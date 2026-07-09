const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema(
  {
    logoUrl: { type: String, default: '' },
    waUrl: { type: String, default: '' },
    fbUrl: { type: String, default: '' },
    igUrl: { type: String, default: '' },
    tikTokUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', SettingsSchema);

