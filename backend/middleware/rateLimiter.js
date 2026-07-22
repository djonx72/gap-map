/**
 * rateLimiter.js — centralised rate-limiting middleware (GapMap_Security_Patch_Brief_v1.0).
 *
 * Exported limiters:
 *
 *   generalLimiter  — broad baseline applied globally to every route. (Keyed by IP)
 *   authLimiter     — stricter limiter scoped to /auth/* routes. (Keyed by IP)
 *   aiLimiter       — tightest limiter for routes that call the Gemini AI API.
 *                     Keyed by authenticated user ID (to prevent shared school
 *                     networks from rate-limiting entire classrooms), falling back to IP.
 *   writeLimiter    — limiter for trusted-user write-heavy actions (e.g. creating classes).
 *                     Keyed by authenticated user ID (to prevent shared school
 *                     networks from rate-limiting entire classrooms), falling back to IP.
 *
 * All limiters use the same { error: "..." } response shape as the rest of the
 * app, and emit standard RateLimit-* headers (RFC-compliant) with legacy
 * X-RateLimit-* headers disabled.
 */
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const keyByUserOrIp = (req, res) => {
  // Prefer the authenticated user's ID so students/teachers sharing a
  // network (e.g. a school computer lab) aren't rate-limited together.
  // Falls back to IP only in the unexpected case req.user isn't set —
  // this should never happen in practice since both limiters below are
  // only ever applied after verifyToken has already run.
  return req.user?.id || ipKeyGenerator(req, res);
};

// ── General — 200 req / 15 min / IP ──────────────────────────────────────────
// Remains IP-based because it runs globally before any authentication check
// in the middleware chain.
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
// Remains IP-based because it protects pre-login/signup requests where no
// user ID exists yet.
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

// ── AI — 15 req / 1 min / User ────────────────────────────────────────────────
// Applied to /submissions/* which triggers calls to the Gemini AI API.
// This is the strictest limiter — AI calls carry both quota and billing risk.
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  keyGenerator: keyByUserOrIp,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error:
      'You are submitting answers too quickly. ' +
      'Please wait a moment before submitting again.',
  },
});

// ── Write — 30 req / 15 min / User ────────────────────────────────────────────
// Intended for trusted-user write-heavy actions like creating classes and questions.
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  keyGenerator: keyByUserOrIp,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'You are creating too many items too quickly. Please wait a moment.',
  },
});
