/**
 * rateLimiter.js — centralised rate-limiting middleware (GapMap_Security_Patch_Brief_v1.0).
 *
 * Three limiters are exported, each scoped for a different layer of the app:
 *
 *   generalLimiter  — broad baseline applied globally to every route.
 *   authLimiter     — stricter limiter scoped to /auth/* routes (replaces the
 *                     old per-route createProfileLimiter from Chunk 2 — do NOT
 *                     stack both on the same path).
 *   aiLimiter       — tightest limiter for routes that call the Gemini AI API
 *                     (e.g. /submissions). Applied in index.js ahead of those
 *                     routes even before they exist, so protection is in place
 *                     the moment the route is wired up.
 *
 * All limiters use the same { error: "..." } response shape as the rest of the
 * app, and emit standard RateLimit-* headers (RFC-compliant) with legacy
 * X-RateLimit-* headers disabled.
 */
import rateLimit from 'express-rate-limit';

// ── General — 200 req / 15 min / IP ──────────────────────────────────────────
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP. Please wait a moment and try again.',
  },
});

// ── Auth — 10 req / 15 min / IP ───────────────────────────────────────────────
// Covers all /auth/* routes (login, sign-up, create-profile, etc.).
// This supersedes the old createProfileLimiter that Chunk 2 applied directly
// on the /auth/create-profile route. That per-route limiter has been removed
// from routes/auth.js to prevent two differently-configured limiters from
// stacking on the same path and double-counting requests.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error:
      'Too many login or sign-up attempts from this IP. ' +
      'Please wait 15 minutes before trying again.',
  },
});

// ── AI — 15 req / 1 min / IP ──────────────────────────────────────────────────
// Applied to /submissions/* which triggers calls to the Gemini AI API.
// This is the strictest limiter — AI calls carry both quota and billing risk.
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error:
      'You are submitting answers too quickly. ' +
      'Please wait a moment before submitting again.',
  },
});
