const crypto = require('crypto');

const PREFIX = 'enc:v1';

const decodeKey = (value) => {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (/^[a-fA-F0-9]{64}$/.test(trimmed)) return Buffer.from(trimmed, 'hex');
  const decoded = Buffer.from(trimmed, 'base64');
  return decoded.length === 32 ? decoded : null;
};

const createTokenCipher = (keyValue) => {
  const key = decodeKey(keyValue);
  if (keyValue && !key) {
    throw new Error('DATA_ENCRYPTION_KEY must be 32 bytes encoded as base64 or 64 hexadecimal characters.');
  }

  const encrypt = (value) => {
    if (!value || !key) return value || '';
    if (String(value).startsWith(`${PREFIX}:`)) return value;

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(String(value), 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return [PREFIX, iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')].join(':');
  };

  const decrypt = (value) => {
    if (!value) return '';
    if (!String(value).startsWith(`${PREFIX}:`)) return value;
    if (!key) throw new Error('DATA_ENCRYPTION_KEY is required to decrypt stored integration credentials.');

    const parts = String(value).split(':');
    if (parts.length !== 5) throw new Error('Stored integration credential has an invalid format.');
    const iv = Buffer.from(parts[2], 'base64url');
    const tag = Buffer.from(parts[3], 'base64url');
    const ciphertext = Buffer.from(parts[4], 'base64url');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  };

  return { encrypt, decrypt, enabled: Boolean(key) };
};

module.exports = { createTokenCipher };
