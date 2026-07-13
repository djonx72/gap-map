import supabaseAdmin from '../lib/supabaseAdmin.js';

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
    const err = new Error('Failed to create profile');
    err.statusCode = 500;
    throw err;
  }

  return data;
};

export const findClassByCode = async (code) => {
  const normalizedCode = code.toUpperCase().trim();
  
  const { data, error } = await supabaseAdmin
    .from('classes')
    .select('*')
    .eq('class_code', normalizedCode)
    .maybeSingle();

  if (error) {
    const err = new Error('Database error while finding class');
    err.statusCode = 500;
    throw err;
  }

  return data; // Returns null if not found thanks to maybeSingle()
};

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
    const err = new Error('Failed to enroll student in class');
    err.statusCode = 500;
    throw err;
  }

  return data;
};
