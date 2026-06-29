const crypto = require('crypto');

const AUDITED_READ_PATHS = [
  /^\/api\/projects(?:\/|$)/,
  /^\/api\/tasks(?:\/|$)/,
  /^\/annotations(?:\/|$)/,
  /^\/annotation-events(?:\/|$)/,
];

const shouldAudit = (req) => (
  req.method !== 'OPTIONS' &&
  (req.method !== 'GET' || AUDITED_READ_PATHS.some((pattern) => pattern.test(req.path)))
);

const createAuditMiddleware = ({ auditCollection, retentionDays = 365 }) => (req, res, next) => {
  const incomingRequestId = req.get('X-Request-Id');
  const requestId = incomingRequestId && /^[a-zA-Z0-9._:-]{8,128}$/.test(incomingRequestId)
    ? incomingRequestId
    : crypto.randomUUID();
  const startedAt = Date.now();

  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  if (auditCollection && shouldAudit(req)) {
    res.on('finish', () => {
      const routePath = typeof req.route?.path === 'string' ? req.route.path : req.path;
      const record = {
        occurredAt: new Date(),
        expiresAt: retentionDays > 0
          ? new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000)
          : undefined,
        requestId,
        actorUserId: req.user?.id
          ? String(req.user.id)
          : req.auditActorUserId || null,
        action: `${req.method} ${routePath}`,
        method: req.method,
        route: routePath,
        statusCode: res.statusCode,
        outcome: res.statusCode < 400 ? 'success' : 'failure',
        durationMs: Date.now() - startedAt,
        ip: req.ip,
        userAgent: String(req.get('user-agent') || '').slice(0, 300),
      };

      auditCollection.insertOne(record).catch((error) => {
        console.error('Security audit write failed:', error.message);
      });
    });
  }

  next();
};

module.exports = { createAuditMiddleware };
