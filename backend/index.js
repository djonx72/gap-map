import './config/env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import logger from './middleware/logger.js';
import { applySwagger } from './config/swagger.js';
import authRoutes from './routes/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security headers (must be first) ──────────────────────────────────────────
// helmet sets X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security,
// Content-Security-Policy, Referrer-Policy, and several others by default.
// Do NOT move this below any route or response-producing middleware.
// Defaults are intentionally kept; see GapMap_Security_Patch_Brief_v1.0.
//
// NOTE: helmet's default CSP is restrictive. If a legitimate client origin is
// blocked during testing (e.g. Swagger UI inline scripts), flag it specifically
// rather than silently loosening the policy.
app.use(helmet());

// ── Core middleware ────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL // Must be set in your production environment!
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// ── Request / response logging ────────────────────────────────────────────────
// Morgan logs every inbound request: method, path, status, timing, and body.
// Health-check GET / is skipped to keep logs clean.
app.use(logger);

// ── Swagger UI + JSON spec ─────────────────────────────────────────────────────
// Interactive docs: http://localhost:5000/api-docs
// Raw spec JSON:    http://localhost:5000/api-docs.json
applySwagger(app);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ message: 'GapMap backend is running', status: 'ok' });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);

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