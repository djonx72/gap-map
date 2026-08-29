import supabaseAdmin from '../lib/supabaseAdmin.js';

/**
 * createProfile — inserts a new row into the profiles table.
 *
 * Throws a structured error (with statusCode + publicMessage) so that the
 * central errorHandler can return a safe, user-facing message without leaking
 * internal database detail.
 */
export const createProfile = async ({ id, full_name, role, school_id, school_name }) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .insert([
      {
        id,
        full_name,
        role,
        school_id,
        school_name
      }
    ])
    .select()
    .single();

  if (error) {
    // Log the raw Supabase error server-side so nothing is lost.
    console.error('Supabase error inserting profile:', error);

    const err = new Error(`DB insert failed in createProfile: ${error.message}`);
    err.statusCode = 500;
    // publicMessage is safe to show the user — no internal detail exposed.
    err.publicMessage = 'We could not create your profile. Please try again.';
    throw err;
  }

  return data;
};

/**
 * findSchoolByCode — looks up a school row by its normalised school code.
 *
 * Returns null if not found or inactive.
 */
export const findSchoolByCode = async (code) => {
  const normalizedCode = code.toUpperCase().trim();

  const { data, error } = await supabaseAdmin
    .from('schools')
    .select('id, school_code, school_name, is_active')
    .eq('school_code', normalizedCode)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    const err = new Error(`DB query failed in findSchoolByCode: ${error.message}`);
    err.statusCode = 500;
    err.publicMessage = 'Unable to verify the school code right now. Please try again.';
    throw err;
  }

  return data;
};

export const getProfileById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, role, school_id, full_name, school_name')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    const err = new Error(`DB query failed in getProfileById: ${error.message}`);
    err.statusCode = 500;
    err.publicMessage = 'Unable to fetch your profile right now. Please try again.';
    throw err;
  }

  return data;
};
