import supabaseAdmin from '../lib/supabaseAdmin.js';

/**
 * createProfile — inserts a new row into the profiles table.
 *
 * Throws a structured error (with statusCode + publicMessage) so that the
 * central errorHandler can return a safe, user-facing message without leaking
 * internal database detail.
 */
export const createProfile = async ({ id, full_name, role, school_name }) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .insert([
      {
        id,
        full_name,
        role,
        school_name: school_name || null
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
 * findClassByCode — looks up a class row by its normalised class code.
 *
 * Returns null (not an error) when the code simply doesn't exist — the
 * controller handles the 404 case directly.  Throws only on a genuine DB error.
 */
export const findClassByCode = async (code) => {
  const normalizedCode = code.toUpperCase().trim();

  const { data, error } = await supabaseAdmin
    .from('classes')
    .select('*')
    .eq('class_code', normalizedCode)
    .maybeSingle();

  if (error) {
    const err = new Error(`DB query failed in findClassByCode: ${error.message}`);
    err.statusCode = 500;
    err.publicMessage = 'Unable to verify the class code right now. Please try again.';
    throw err;
  }

  return data; // Returns null if not found thanks to maybeSingle()
};

/**
 * enrollStudent — inserts a class_enrollments row linking a student to a class.
 */
export const enrollStudent = async ({ classId, studentId }) => {
  const { data, error } = await supabaseAdmin
    .from('class_enrollments')
    .insert([
      {
        class_id: classId,
        student_id: studentId
      }
    ])
    .select()
    .single();

  if (error) {
    const err = new Error(`DB insert failed in enrollStudent: ${error.message}`);
    err.statusCode = 500;
    err.publicMessage = 'We could not enrol you in that class. Please try again.';
    throw err;
  }

  return data;
};
