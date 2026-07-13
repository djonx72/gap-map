import 'dotenv/config';

const requiredEnvs = [
  'SUPABASE_URL',
  'SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL'
];

const missingEnvs = requiredEnvs.filter(envName => !process.env[envName]);

if (missingEnvs.length > 0) {
  console.error(`ERROR: Missing required environment variables: ${missingEnvs.join(', ')}`);
  process.exit(1);
}
