const crypto = require('crypto');

const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32 bytes = 64 hex characters
const iv = Buffer.from(process.env.ENCRYPTION_IV, 'hex');   // 16 bytes = 32 hex characters

function encrypt(text) {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString('hex');
}

function decrypt(text) {
  const encryptedText = Buffer.from(text, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

module.exports = { encrypt, decrypt };