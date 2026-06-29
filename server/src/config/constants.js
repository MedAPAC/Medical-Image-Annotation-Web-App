const path = require('path');
const { readSecret } = require('./secrets');

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const PORT = Number.parseInt(process.env.PORT || '5000', 10);
const mongoPassword = readSecret('MONGO_PASSWORD');
const MONGO_URL = readSecret('MONGO_URL') || (
  process.env.MONGO_HOST && process.env.MONGO_USER && mongoPassword
    ? `mongodb://${encodeURIComponent(process.env.MONGO_USER)}:${encodeURIComponent(mongoPassword)}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT || '27017'}/${process.env.MONGO_DB_NAME || 'annotationApp'}?authSource=${encodeURIComponent(process.env.MONGO_AUTH_SOURCE || process.env.MONGO_DB_NAME || 'annotationApp')}`
    : 'mongodb://localhost:27017'
);
const DB_NAME = process.env.MONGO_DB_NAME || 'annotationApp';
const DEVELOPMENT_JWT_SECRET = 'development-only-jwt-secret-change-before-production';
const JWT_SECRET = readSecret('JWT_SECRET', DEVELOPMENT_JWT_SECRET);
const JWT_ISSUER = process.env.JWT_ISSUER || 'medical-image-annotation-api';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'medical-image-annotation-client';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const SERVER_ROOT = path.resolve(__dirname, '..', '..');
const UPLOADS_ROOT = path.resolve(process.env.UPLOADS_ROOT || path.join(SERVER_ROOT, 'uploads'));
const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || '25mb';
const MAX_UPLOAD_FILE_BYTES = Number.parseInt(
  process.env.MAX_UPLOAD_FILE_BYTES || String(1000 * 1024 * 1024),
  10
);
const MAX_UPLOAD_FILES = Number.parseInt(process.env.MAX_UPLOAD_FILES || '2000', 10);
const API_RATE_LIMIT_WINDOW_MS = Number.parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '900000', 10);
const API_RATE_LIMIT_MAX = Number.parseInt(process.env.API_RATE_LIMIT_MAX || '2000', 10);
const AUTH_RATE_LIMIT_MAX = Number.parseInt(process.env.AUTH_RATE_LIMIT_MAX || '20', 10);
const DATA_ENCRYPTION_KEY = readSecret('DATA_ENCRYPTION_KEY');
const AUDIT_RETENTION_DAYS = Number.parseInt(process.env.AUDIT_RETENTION_DAYS || '365', 10);
const CLIENT_BASE_URL = process.env.CLIENT_BASE_URL || 'http://localhost:3000';
const CORS_ORIGINS = (process.env.CORS_ORIGINS || CLIENT_BASE_URL)
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

const parseTrustProxy = (value) => {
  if (!value) return false;
  if (value === 'true') return 1;
  if (value === 'false') return false;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : value;
};

const TRUST_PROXY = parseTrustProxy(process.env.TRUST_PROXY);
const ENFORCE_HTTPS = process.env.ENFORCE_HTTPS === 'true';

const assertSecurityConfig = () => {
  const errors = [];

  if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
    errors.push('PORT must be a valid TCP port.');
  }

  if (IS_PRODUCTION) {
    if (JWT_SECRET === DEVELOPMENT_JWT_SECRET || JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be set to at least 32 unpredictable characters.');
    }
    if (CORS_ORIGINS.length === 0 || CORS_ORIGINS.includes('*')) {
      errors.push('CORS_ORIGINS must contain explicit trusted origins and cannot use *.');
    }
    if (
      (process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_SECRET) &&
      !DATA_ENCRYPTION_KEY
    ) {
      errors.push('DATA_ENCRYPTION_KEY is required when Google Drive is enabled.');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Unsafe server configuration:\n- ${errors.join('\n- ')}`);
  }

  if (!IS_PRODUCTION && JWT_SECRET === DEVELOPMENT_JWT_SECRET) {
    console.warn('Security warning: using the development JWT secret. Set JWT_SECRET before sharing this server.');
  }
};

module.exports = {
  NODE_ENV,
  IS_PRODUCTION,
  PORT,
  MONGO_URL,
  DB_NAME,
  JWT_SECRET,
  JWT_ISSUER,
  JWT_AUDIENCE,
  JWT_EXPIRES_IN,
  SERVER_ROOT,
  UPLOADS_ROOT,
  JSON_BODY_LIMIT,
  MAX_UPLOAD_FILE_BYTES,
  MAX_UPLOAD_FILES,
  API_RATE_LIMIT_WINDOW_MS,
  API_RATE_LIMIT_MAX,
  AUTH_RATE_LIMIT_MAX,
  DATA_ENCRYPTION_KEY,
  AUDIT_RETENTION_DAYS,
  CLIENT_BASE_URL,
  CORS_ORIGINS,
  TRUST_PROXY,
  ENFORCE_HTTPS,
  assertSecurityConfig,
};
