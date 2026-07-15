/**
 * errorHandler — centralised Express error-handling middleware.
 *
 * Security contract (GapMap_Security_Patch_Brief_v1.0):
 *  - Full error detail (message, stack, request context, timestamp) is ALWAYS
 *    written to server-side logs — it must never be lost.
 *  - The client-facing response is sanitised based on NODE_ENV:
 *      • err.publicMessage  → always safe to return, regardless of environment.
 *      • development        → raw err.message is acceptable (speeds up debugging).
 *      • production         → generic fallback only — raw messages are NEVER sent.
 *  - Stack traces are included in the JSON response ONLY in development.
 *
 * ⚠️  DEPLOYMENT NOTE (manual step required):
 *  NODE_ENV=production MUST be set in your hosting dashboard (e.g. Render →
 *  Environment Variables) before deploying.  Setting it only in .env is not
 *  sufficient for most PaaS hosts — the variable must exist in the actual
 *  runtime environment.  Without this, the production guard in this file will
 *  not activate on the live server.
 */
export const errorHandler = (err, req, res, next) => {
  // ── 1. Full server-side log — always, regardless of environment ──────────────
  // This block must never be removed or conditioned on NODE_ENV.
  // Internal detail stays here, never in the client response.
  console.error('━━━━━━━━━━ [GapMap Error] ━━━━━━━━━━');
  console.error(`Timestamp : ${new Date().toISOString()}`);
  console.error(`Method    : ${req.method}`);
  console.error(`URL       : ${req.originalUrl}`);
  console.error(`Message   : ${err.message}`);
  console.error(`Stack     :\n${err.stack}`);
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // ── 2. Determine HTTP status ─────────────────────────────────────────────────
  const statusCode = err.statusCode || 500;

  // ── 3. Build safe client-facing message ─────────────────────────────────────
  const isProduction = process.env.NODE_ENV === 'production';

  let clientMessage;
  if (err.publicMessage) {
    // A pre-written, human-safe message was attached to the error — always use it.
    clientMessage = err.publicMessage;
  } else if (!isProduction) {
    // Development only: raw message is acceptable for local debugging speed.
    clientMessage = err.message || 'Something went wrong. Please try again.';
  } else {
    // Production: never leak internal error detail to the client.
    clientMessage = 'Something went wrong. Please try again.';
  }

  // ── 4. Build response payload ────────────────────────────────────────────────
  const responsePayload = { error: clientMessage };

  // Stack trace in response is permitted ONLY in development.
  if (!isProduction && err.stack) {
    responsePayload.stack = err.stack;
  }

  res.status(statusCode).json(responsePayload);
};
