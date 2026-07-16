import './config/env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import logger from './middleware/logger.js';
import { applySwagger } from './config/swagger.js';
import authRoutes from './routes/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import {
  generalLimiter,
  authLimiter,
  aiLimiter,
} from './middleware/rateLimiter.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security headers (must be first) ──────────────────────────────────────────
// helmet sets X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security,
// Content-Security-Policy, Referrer-Policy, and several others by default.
// Do NOT move this below any route or response-producing middleware.
//
// CSP note: swagger-ui-express serves its own bundled assets (no external CDN)
// but requires 'unsafe-inline' for its inline scripts and styles to render.
// Only scriptSrc and styleSrc are relaxed from the default — every other
// directive and all other helmet modules remain at their secure defaults.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        // swagger-ui-express injects inline <script> blocks — required for the UI to boot.
        'script-src': ["'self'", "'unsafe-inline'"],
        // swagger-ui-express injects inline <style> blocks for layout/theming.
        'style-src': ["'self'", 'https:', "'unsafe-inline'"],
      },
    },
  })
);

// ── Permissions-Policy ────────────────────────────────────────────────────────
// helmet v8 does not ship a built-in permissionsPolicy middleware, so we set
// the header manually. This disables all browser feature APIs that a pure JSON
// backend API has no use for, and is the only header preventing an A+ score on
// securityheaders.com (it caps the score at A when absent).
app.use((_req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'accelerometer=()',
      'gyroscope=()',
      'magnetometer=()',
      'payment=()',
      'usb=()',
      'fullscreen=()',
      'picture-in-picture=()',
      'display-capture=()',
      'interest-cohort=()',
    ].join(', ')
  );
  next();
});


// ── CORS ─────────────────────────────────────────────────────────────────────
// Explicit whitelist: the deployed frontend URL (required at startup via env.js)
// plus the two local dev origins. Any undefined/falsy entry is filtered out so
// a missing env var never silently becomes a wildcard.
//
// Origin-function behaviour:
//   • No Origin header (Postman, server-to-server, mobile) → allowed through.
//   • Origin in the whitelist → allowed.
//   • Anything else → rejected with a CORS error; the blocked origin is logged
//     with console.warn so it's visible in Render's log stream / monitoring.
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean); // strips any undefined/null/empty entries

app.use(
  cors({
    origin(requestOrigin, callback) {
      // Allow requests with no Origin header (non-browser clients).
      if (!requestOrigin) return callback(null, true);

      if (allowedOrigins.includes(requestOrigin)) {
        return callback(null, true);
      }

      // Reject and log — never silently pass an unknown origin.
      console.warn(
        `[CORS] Blocked request from unlisted origin: "${requestOrigin}". ` +
        `Allowed origins: ${allowedOrigins.join(', ')}`
      );
      return callback(new Error(`CORS: origin "${requestOrigin}" is not allowed.`));
    },
    credentials: true,
  })
);
app.use(express.json());

// ── Request / response logging ────────────────────────────────────────────────
// Morgan logs every inbound request: method, path, status, timing, and body.
// Health-check GET / is skipped to keep logs clean.
app.use(logger);

// ── Swagger UI + JSON spec ─────────────────────────────────────────────────────
// Interactive docs: http://localhost:5000/api-docs
// Raw spec JSON:    http://localhost:5000/api-docs.json
if (process.env.NODE_ENV === 'production') {
  // Explicitly return 404 in production so the route doesn't just fall through
  // to a generic handler, but actively refuses access.
  const blockSwagger = (_req, res) => res.status(404).json({ error: 'Not found' });
  app.get('/api-docs', blockSwagger);
  app.get('/api-docs.json', blockSwagger);
} else {
  console.log('📖  Swagger API docs enabled (development mode)');
  applySwagger(app);
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ message: 'GapMap backend is running', status: 'ok' });
});

// ── Rate limiting ─────────────────────────────────────────────────────────────
// generalLimiter: broad 200 req/15 min baseline applied to every route.
// Applied here, after helmet/CORS/body-parse, so it runs on all real traffic
// but does not interfere with internal middleware setup.
app.use(generalLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
// authLimiter is scoped to /auth/* — replaces the old per-route createProfileLimiter
// that Chunk 2 applied directly on /auth/create-profile. That route-level import
// has been removed from routes/auth.js to prevent double-counting.
app.use('/auth', authLimiter, authRoutes);

// aiLimiter is pre-wired to /submissions now so the protection is already in
// place the moment the submission routes are added in a later chunk.
// A path with a limiter and no route handlers attached does NOT cause startup
// or runtime errors — Express simply passes the request through to the 404
// handler if no matching route is registered.
app.use('/submissions', aiLimiter);

// ── Error handling (must be last) ─────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  const isProd = process.env.NODE_ENV === 'production';
  const baseUrl = isProd 
    ? (process.env.BACKEND_URL || `http://localhost:${PORT}`) 
    : `http://localhost:${PORT}`;

  console.log(`\n🚀  GapMap backend running on ${baseUrl}`);
  console.log(`📖  API docs:  ${baseUrl}/api-docs`);
  console.log(`📄  Raw spec:  ${baseUrl}/api-docs.json\n`);
});