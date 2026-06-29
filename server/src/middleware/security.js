const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');

const createCorsOptions = (allowedOrigins) => ({
  credentials: false,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Accept-Language', 'X-Request-Id'],
  exposedHeaders: ['Content-Disposition', 'Content-Length', 'X-Request-Id'],
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

const configureSecurityMiddleware = (app, options) => {
  const {
    isProduction,
    trustProxy,
    corsOrigins,
    jsonBodyLimit,
    rateLimitWindowMs,
    apiRateLimitMax,
    authRateLimitMax,
  } = options;

  app.disable('x-powered-by');
  if (trustProxy !== false) app.set('trust proxy', trustProxy);

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    strictTransportSecurity: isProduction
      ? { maxAge: 63072000, includeSubDomains: true, preload: true }
      : false,
  }));
  app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    next();
  });
  app.use(cors(createCorsOptions(corsOrigins)));
  app.use(express.json({ limit: jsonBodyLimit, strict: true }));
  app.use(express.urlencoded({ extended: false, limit: '64kb', parameterLimit: 100 }));

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
