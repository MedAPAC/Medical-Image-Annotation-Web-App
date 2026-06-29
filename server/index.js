const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const constants = require('./src/config/constants');
const { connectDatabase, ObjectId } = require('./src/config/database');
const { createUploadMiddleware } = require('./src/config/uploads');
const { createAuthMiddleware } = require('./src/middleware/auth');
const { createAccessMiddleware } = require('./src/middleware/access');
const { createAuditMiddleware } = require('./src/middleware/audit');
const { configureSecurityMiddleware } = require('./src/middleware/security');
const { createAnnotationEvents } = require('./src/realtime/annotationEvents');
const { createTokenCipher } = require('./src/security/tokenCipher');
const { createGoogleDriveService } = require('./src/services/googleDriveService');
const { createUserTeamService } = require('./src/services/userTeamService');
const { makeRequestError } = require('./src/utils/errors');
const { getFileType } = require('./src/utils/fileTypes');
const storedFiles = require('./src/utils/storedFiles');
const { registerRoutes } = require('./src/routes');

const startServer = async () => {
  constants.assertSecurityConfig();

  const app = express();
  const { client, collections } = await connectDatabase();
  const { upload, taskUpload } = createUploadMiddleware(constants.UPLOADS_ROOT);
  const auth = createAuthMiddleware({
    jwtSecret: constants.JWT_SECRET,
    issuer: constants.JWT_ISSUER,
    audience: constants.JWT_AUDIENCE,
    accessTokenExpiresIn: constants.JWT_EXPIRES_IN,
  });
  const { checkProjectAccess, checkTaskAccess } = createAccessMiddleware({ collections, ObjectId });
  const annotationEvents = createAnnotationEvents({ collections, ObjectId });
  const tokenCipher = createTokenCipher(constants.DATA_ENCRYPTION_KEY);
  const userTeamService = createUserTeamService({ collections, ObjectId, makeRequestError });
  const googleDriveService = createGoogleDriveService({
    collections,
    ObjectId,
    port: constants.PORT,
    makeRequestError,
    tokenCipher,
  });

  if (!tokenCipher.enabled && (process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_SECRET)) {
    console.warn('Security warning: Google credentials will not be encrypted until DATA_ENCRYPTION_KEY is configured.');
  }

  app.use(createAuditMiddleware({
    auditCollection: collections.securityAuditCollection,
    retentionDays: constants.AUDIT_RETENTION_DAYS,
  }));
  configureSecurityMiddleware(app, {
    isProduction: constants.IS_PRODUCTION,
    trustProxy: constants.TRUST_PROXY,
    corsOrigins: constants.CORS_ORIGINS,
    jsonBodyLimit: constants.JSON_BODY_LIMIT,
    rateLimitWindowMs: constants.API_RATE_LIMIT_WINDOW_MS,
    apiRateLimitMax: constants.API_RATE_LIMIT_MAX,
    authRateLimitMax: constants.AUTH_RATE_LIMIT_MAX,
    enforceHttps: constants.ENFORCE_HTTPS,
  });
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  annotationEvents.registerAnnotationEventRoutes(app, {
    authenticateToken: auth.authenticateToken,
    authenticateEventToken: auth.authenticateEventToken,
    issueEventToken: auth.issueEventToken,
  });

  registerRoutes(app, {
    ...collections,
    ...annotationEvents,
    ...googleDriveService,
    ...userTeamService,
    ...auth,
    ...storedFiles,
    checkProjectAccess,
    checkTaskAccess,
    upload,
    taskUpload,
    ObjectId,
    bcrypt,
    jwt,
    crypto,
    fs,
    path,
    tokenCipher,
    UPLOADS_ROOT: constants.UPLOADS_ROOT,
    CLIENT_BASE_URL: constants.CLIENT_BASE_URL,
    CORS_ORIGINS: constants.CORS_ORIGINS,
    makeRequestError,
    getFileType,
  });

  app.use((req, res) => res.status(404).json({ error: 'Endpoint not found' }));
  app.use((error, req, res, next) => {
    const isUploadError = error.name === 'MulterError';
    const status = error.status || (isUploadError ? 400 : 500);
    const message = status >= 500 ? 'Internal server error' : error.message;
    console.error(`Request ${req.requestId || 'unknown'} failed:`, error);
    res.status(status).json({ error: message, requestId: req.requestId });
  });

  const server = app.listen(constants.PORT, () => {
    console.log(`Server listening on port ${constants.PORT}.`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received. Closing server.`);
    server.close(async () => {
      await client.close().catch((error) => console.error('MongoDB shutdown error:', error));
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
