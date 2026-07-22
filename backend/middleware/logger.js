/**
 * logger.js — request/response logging middleware using morgan.
 *
 * Two formats are used:
 *  - In development: "dev" — concise, colour-coded output per request.
 *  - In production:  "combined" — full Apache-style log line for log aggregators.
 *
 * Additionally, a tiny custom token logs the parsed JSON body so you can see
 * exactly what payload reached the server (passwords are scrubbed).
 */
import morgan from 'morgan';

// ── Custom token: JSON body (sensitive fields redacted) ───────────────────────
const sensitiveFields = [
  'password',
  'new_password',
  'token',
  'api_key',
  'email',
  'student_answer',
  'answer_content',
  'correct_answer',
  'content',
  'teacher_report',
  'explanation',
  'root_gap',
];

morgan.token('body', (req) => {
  if (!req.body || Object.keys(req.body).length === 0) return '-';

  const safe = { ...req.body };
  
  // Scrub all sensitive fields from the log output (does not alter req.body)
  for (const field of sensitiveFields) {
    if (safe[field] !== undefined) {
      safe[field] = '[REDACTED]';
    }
  }

  return JSON.stringify(safe);
});

// ── Format strings ─────────────────────────────────────────────────────────────
const DEV_FORMAT =
  ':method :url :status :response-time ms — body: :body';

const PROD_FORMAT =
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

const format = process.env.NODE_ENV === 'production' ? PROD_FORMAT : DEV_FORMAT;

// ── Skip logging for health-check endpoint to reduce noise ────────────────────
const skip = (req) => req.url === '/' && req.method === 'GET';

const logger = morgan(format, { skip });

export default logger;
