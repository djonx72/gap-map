import 'dotenv/config';

const requiredEnvs = [
  'SUPABASE_URL',
  'SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL',
  // FRONTEND_URL is required so CORS never silently receives `undefined` as the
  // allowed origin. A missing value could cause some CORS implementations to
  // allow all origins, leaking authenticated access to student data and the AI
  // engine. This must also be set on the hosting dashboard (e.g. Render's
  // Environment Variables) — the .env file alone is not read in production.
  'FRONTEND_URL',
  // GEMINI_API_KEY is required for the AI diagnostic engine. Without it the
  // server starts but all AI analysis calls silently fail — better to crash
  // at startup so the misconfiguration is caught immediately.
  'GEMINI_API_KEY',
];

const missingEnvs = requiredEnvs.filter(envName => !process.env[envName]);

if (missingEnvs.length > 0) {
  console.error(`ERROR: Missing required environment variables: ${missingEnvs.join(', ')}`);
  process.exit(1);
}
