import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// For normal user-authenticated requests (RLS active)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY
);

// For backend-only operations that bypass RLS (AI writes, admin tasks)
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default supabase;