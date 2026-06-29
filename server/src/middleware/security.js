const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');

const createCorsOptions = (allowedOrigins) => ({
  credentials: false,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Accept-Language', 'X-Request-Id'],
  exposedHeaders: ['Content-Disposition', 'Content-Length', 'X-Content-SHA256', 'X-Request-Id'],
  maxAge: 600,
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
      callback(null, true);
      return;
    }
    const error = new Error('Origin is not allowed by CORS policy.');
    error.status = 403;
    callback(error);
  },
});

const createRateLimiter = ({ windowMs, limit, message }) => rateLimit({
  windowMs,
  limit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  message: { error: message },
});

const hasUnsafeStructure = (value, depth = 0) => {
  if (depth > 100) return true;
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, nestedValue]) => (
    key.startsWith('$') ||
    key === '__proto__' ||
    hasUnsafeStructure(nestedValue, depth + 1)
  ));
};

const configureSecurityMiddleware = (app, options) => {
  const {
    isProduction,
    trustProxy,
    corsOrigins,
    jsonBodyLimit,
    rateLimitWindowMs,
    apiRateLimitMax,
    authRateLimitMax,
    enforceHttps,
  } = options;

  app.disable('x-powered-by');
  if (trustProxy !== false) app.set('trust proxy', trustProxy);

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    strictTransportSecurity: isProduction
      ? { maxAge: 63072000, includeSubDomains: true, preload: true }
      : false,
  }));
  if (enforceHttps) {
    app.use((req, res, next) => {
      if (!req.secure) return res.status(400).json({ error: 'HTTPS is required' });
      return next();
    });
  }
  app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    next();
  });
  app.use(cors(createCorsOptions(corsOrigins)));
  app.use(express.json({ limit: jsonBodyLimit, strict: true }));
  app.use(express.urlencoded({ extended: false, limit: '64kb', parameterLimit: 100 }));
  app.use((req, res, next) => {
    if (hasUnsafeStructure(req.body)) {
      return res.status(400).json({ error: 'Request contains unsafe object keys or excessive nesting' });
    }
    return next();
  });

  const apiLimiter = createRateLimiter({
    windowMs: rateLimitWindowMs,
    limit: apiRateLimitMax,
    message: 'Too many requests. Please wait and try again.',
  });
  const authLimiter = createRateLimiter({
    windowMs: rateLimitWindowMs,
    limit: authRateLimitMax,
    message: 'Too many authentication attempts. Please wait and try again.',
  });

  app.use(['/api/auth/login', '/api/auth/signup', '/login', '/signup'], authLimiter);
  app.use(apiLimiter);
  app.use((req, res, next) => {
    if (
      req.path.startsWith('/api/') ||
      req.path.startsWith('/annotations/') ||
      req.path.startsWith('/annotation-events/') ||
      req.path === '/save-annotations'
    ) {
      res.setHeader('Cache-Control', 'no-store, private');
      res.setHeader('Pragma', 'no-cache');
    }
    next();
  });
};

module.exports = { configureSecurityMiddleware };
