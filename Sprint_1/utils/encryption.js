// utils/encryption.js
const crypto = require('crypto');

const ENCRYPTION_SECRET = process.env.ENCRYPTION_KEY || 'default_secret_key';

// Ensure key is 32 bytes for AES-256
const KEY = crypto.createHash('sha256').update(String(ENCRYPTION_SECRET)).digest();
const IV_LENGTH = 16; // AES block size

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const result = iv.toString('hex') + ':' + encrypted;
  return result;
}

function decrypt(encryptedText) {
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', KEY, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encrypt, decrypt };