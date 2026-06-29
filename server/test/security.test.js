const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');
const test = require('node:test');
const jwt = require('jsonwebtoken');

const { createAuthMiddleware } = require('../src/middleware/auth');
const { createTokenCipher } = require('../src/security/tokenCipher');
const { resolveTaskFilePath } = require('../src/utils/storedFiles');

test('OAuth credentials are encrypted with authenticated encryption', () => {
  const key = crypto.randomBytes(32).toString('base64');
  const cipher = createTokenCipher(key);
  const encrypted = cipher.encrypt('refresh-token-value');

  assert.notEqual(encrypted, 'refresh-token-value');
  assert.equal(cipher.decrypt(encrypted), 'refresh-token-value');
  assert.throws(() => createTokenCipher(crypto.randomBytes(16).toString('base64')));
});

test('access and realtime tokens carry explicit, scoped purposes', () => {
  const secret = crypto.randomBytes(48).toString('base64url');
  const issuer = 'test-issuer';
  const audience = 'test-audience';
  const auth = createAuthMiddleware({
    jwtSecret: secret,
    issuer,
    audience,
    accessTokenExpiresIn: '5m',
  });

  const accessToken = auth.signAccessToken({ id: 'user-1', email: 'user@example.org' });
  const eventToken = auth.issueEventToken({ id: 'user-1', email: 'user@example.org' }, 'task-1');
  const options = { algorithms: ['HS256'], issuer, audience };

  assert.equal(jwt.verify(accessToken, secret, options).purpose, 'access');
  const eventClaims = jwt.verify(eventToken, secret, options);
  assert.equal(eventClaims.purpose, 'annotation-events');
  assert.equal(eventClaims.taskId, 'task-1');
});

test('stored medical files cannot resolve outside their task directory', () => {
  const uploadsRoot = path.resolve('test-uploads-root');
  const taskId = 'task-1';
  const taskRoot = path.join(uploadsRoot, 'tasks', taskId);
  const expectedPath = path.join(taskRoot, 'scan.dcm');

  assert.equal(
    resolveTaskFilePath(uploadsRoot, taskId, { filename: 'scan.dcm', path: expectedPath }),
    expectedPath
  );
  assert.throws(() => resolveTaskFilePath(uploadsRoot, taskId, {
    filename: 'scan.dcm',
    path: path.join(uploadsRoot, 'other-task', 'scan.dcm'),
  }));
});
