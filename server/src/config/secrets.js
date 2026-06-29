const fs = require('fs');

const readSecret = (name, fallback = '') => {
  if (process.env[name]) return process.env[name];
  const secretFile = process.env[`${name}_FILE`];
  if (!secretFile) return fallback;
  return fs.readFileSync(secretFile, 'utf8').trim();
};

module.exports = { readSecret };
