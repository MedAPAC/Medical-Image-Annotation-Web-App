const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const examplePath = path.join(root, '.env.docker.example');
const outputPath = path.join(root, '.env.docker');

if (fs.existsSync(outputPath)) {
  console.error('.env.docker already exists; refusing to overwrite secrets.');
  process.exit(1);
}

const randomUrlSecret = (bytes = 48) => crypto.randomBytes(bytes).toString('base64url');
const encryptionKey = crypto.randomBytes(32).toString('base64');
let contents = fs.readFileSync(examplePath, 'utf8');

contents = contents
  .replace('replace-with-a-long-random-base64url-secret', randomUrlSecret())
  .replace('replace-with-a-different-long-random-base64url-secret', randomUrlSecret())
  .replace('replace-with-at-least-32-random-characters', randomUrlSecret())
  .replace('replace-with-exactly-32-bytes-encoded-as-base64', encryptionKey);

fs.writeFileSync(outputPath, contents, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
console.log('Created .env.docker with random local secrets.');
