const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 } // 10-minute expiry
});

module.exports = mongoose.model('PasswordReset', passwordResetSchema);