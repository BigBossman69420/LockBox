const mongoose = require('mongoose');

const credentialSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  site: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true }, // Optional: encrypt this later
}, { timestamps: true });

module.exports = mongoose.model('Credential', credentialSchema);