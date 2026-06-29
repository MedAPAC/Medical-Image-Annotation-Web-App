const jwt = require('jsonwebtoken');

const createAuthMiddleware = ({
  jwtSecret,
  issuer,
  audience,
  accessTokenExpiresIn,
}) => {
  const verificationOptions = {
    algorithms: ['HS256'],
    issuer,
    audience,
  };

  const readBearerToken = (req) => {
    const authorization = req.get('authorization');
    if (!authorization) return null;
    const match = authorization.match(/^Bearer\s+([^\s]+)$/i);
    return match ? match[1] : null;
  };

  const verify = (token) => jwt.verify(token, jwtSecret, verificationOptions);

  const sign = (payload, options = {}) => jwt.sign(payload, jwtSecret, {
    algorithm: 'HS256',
    issuer,
    audience,
    ...options,
  });

  const signAccessToken = (payload) => sign(
    { ...payload, id: String(payload.id), purpose: 'access' },
    { expiresIn: accessTokenExpiresIn }
  );

  const issueEventToken = (user, taskId) => sign({
    id: String(user.id),
    email: user.email,
    taskId: String(taskId),
    purpose: 'annotation-events',
  }, { expiresIn: '15m' });

  const signOAuthState = (payload) => sign(
    { ...payload, purpose: 'google-oauth-state' },
    { expiresIn: '10m' }
  );

  const verifyOAuthState = (token) => {
    const payload = verify(token);
    if (payload.purpose !== 'google-oauth-state') throw new Error('Invalid OAuth state purpose.');
    return payload;
  };

  const authenticateToken = (req, res, next) => {
    const token = readBearerToken(req);
    if (!token) return res.status(401).json({ error: 'Access token required' });

    try {
      const user = verify(token);
      if (user.purpose && user.purpose !== 'access') {
        return res.status(401).json({ error: 'Invalid access token' });
      }
      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };

  const authenticateEventToken = (req, res, next) => {
    const headerToken = readBearerToken(req);
    const queryToken = typeof req.query.ticket === 'string' ? req.query.ticket : null;
    const token = headerToken || queryToken;
    if (!token) return res.status(401).json({ error: 'Event access ticket required' });

    try {
      const user = verify(token);
      if (queryToken && user.purpose !== 'annotation-events') {
        return res.status(401).json({ error: 'Invalid event access ticket' });
      }
      if (user.purpose === 'annotation-events' && String(user.taskId) !== String(req.params.taskId)) {
        return res.status(403).json({ error: 'Event ticket does not grant access to this task' });
      }
      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired event access ticket' });
    }
  };

  return {
    authenticateToken,
    authenticateEventToken,
    signAccessToken,
    issueEventToken,
    signOAuthState,
    verifyOAuthState,
  };
};

module.exports = { createAuthMiddleware };
