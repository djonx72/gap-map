import supabaseAdmin from '../lib/supabaseAdmin.js';

const CLASS_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const generateRandomCode = () => {
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += CLASS_CODE_CHARS.charAt(Math.floor(Math.random() * CLASS_CODE_CHARS.length));
  }
  return result;
};

export const generateUniqueClassCode = async () => {
  for (let attempts = 0; attempts < 10; attempts++) {
    const code = generateRandomCode();
    // Check if code exists
    const { data, error } = await supabaseAdmin
      .from('classes')
      .select('id')
      .eq('class_code', code)
      .limit(1);

    if (error) {
      console.error('[classService.generateUniqueClassCode] DB error:', error);
      const err = new Error('Could not generate a unique class code. Please try again.');
      err.statusCode = 500;
      err.publicMessage = 'Could not generate a unique class code. Please try again.';
      throw err;
    }

    if (!data || data.length === 0) {
      return code; // Unique code found
    }
  }

  const err = new Error('Could not generate a unique class code after 10 attempts.');
  err.statusCode = 500;
  err.publicMessage = 'Could not generate a unique class code. Please try again.';
  throw err;
};

export const createClass = async (teacherId, name, subject) => {
  if (!name || !subject || !teacherId) {
    const err = new Error('Validation failed');
    err.statusCode = 400;
    err.publicMessage = 'Missing required fields.';
    throw err;
  }

  const trimmedName = name.trim();
  const trimmedSubject = subject.trim();

  for (let attempts = 0; attempts < 3; attempts++) {
    const class_code = await generateUniqueClassCode();

    const { data, error } = await supabaseAdmin
      .from('classes')
      .insert([
        { name: trimmedName, subject: trimmedSubject, teacher_id: teacherId, class_code }
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        console.warn(`[classService.createClass] Unique violation for class_code ${class_code}. Retrying... (${attempts + 1}/3)`);
        continue;
      }
      console.error('[classService.createClass] DB insert error:', error);
      const err = new Error('Failed to create class.');
      err.statusCode = 500;
      err.publicMessage = 'Failed to create class. Please try again.';
      throw err;
    }

    return data;
  }

  const err = new Error('Failed to create class after 3 attempts due to collisions.');
  err.statusCode = 500;
  err.publicMessage = 'Failed to create class. Please try again.';
  throw err;
};

export const getTeacherClasses = async (teacherId) => {
  const { data, error } = await supabaseAdmin
    .from('classes')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[classService.getTeacherClasses] DB select error:', error);
    const err = new Error('Failed to fetch classes.');
    err.statusCode = 500;
    err.publicMessage = 'Failed to fetch classes. Please try again.';
    throw err;
  }

  return data || [];
};

export const getClassById = async (classId, teacherId) => {
  const { data, error } = await supabaseAdmin
    .from('classes')
    .select('*')
    .eq('id', classId)
    .eq('teacher_id', teacherId)
    .single();

  if (error) {
    // If no row is found, Supabase returns PGRST116.
    if (error.code !== 'PGRST116') {
      console.error('[classService.getClassById] DB select error:', error);
      const err = new Error('Failed to load class.');
      err.statusCode = 500;
      err.publicMessage = 'Failed to load class. Please try again.';
      throw err;
    }
    const err = new Error('Class not found.');
    err.statusCode = 404;
    err.publicMessage = 'Class not found.';
    throw err;
  }

  if (!data) {
    const err = new Error('Class not found.');
    err.statusCode = 404;
    err.publicMessage = 'Class not found.';
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
    const err = new Error(`DB query failed in findClassByCode: ${error.message}`);
    err.statusCode = 500;
    err.publicMessage = 'Unable to verify the class code right now. Please try again.';
    throw err;
  }

  return data;
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
    if (error.code === '23505') {
      const err = new Error('Unique constraint violation in enrollStudent');
      err.statusCode = 409;
      err.publicMessage = 'You are already enrolled in this class.';
      throw err;
    }
    const err = new Error(`DB insert failed in enrollStudent: ${error.message}`);
    err.statusCode = 500;
    err.publicMessage = 'We could not enrol you in that class. Please try again.';
    throw err;
  }

  return data;
};

export const getSchoolClasses = async (schoolId, studentId) => {
  // Step A: Query classes for the given school, selecting specific fields (NO class_code)
  const { data: classesData, error: classesError } = await supabaseAdmin
    .from('classes')
    .select('id, name, subject, teacher_id, created_at')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });

  if (classesError) {
    console.error('[classService.getSchoolClasses] DB error (classes):', classesError);
    const err = new Error('Failed to load classes. Please try again.');
    err.statusCode = 500;
    err.publicMessage = 'Failed to load classes. Please try again.';
    throw err;
  }

  // Step F: Return early if zero classes
  if (!classesData || classesData.length === 0) {
    return [];
  }

  // Step B: Query profiles for the distinct set of teacher_ids
  const teacherIds = [...new Set(classesData.map(c => c.teacher_id))];
  const { data: teachersData, error: teachersError } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name')
    .in('id', teacherIds);

  if (teachersError) {
    console.error('[classService.getSchoolClasses] DB error (profiles):', teachersError);
    const err = new Error('Failed to load classes. Please try again.');
    err.statusCode = 500;
    err.publicMessage = 'Failed to load classes. Please try again.';
    throw err;
  }

  const teacherMap = {};
  teachersData.forEach(t => {
    teacherMap[t.id] = t.full_name;
  });

  // Step C: Query class_enrollments for the student's enrollments in these classes
  const classIds = classesData.map(c => c.id);
  const { data: enrollmentsData, error: enrollmentsError } = await supabaseAdmin
    .from('class_enrollments')
    .select('class_id')
    .eq('student_id', studentId)
    .in('class_id', classIds);

  if (enrollmentsError) {
    console.error('[classService.getSchoolClasses] DB error (enrollments):', enrollmentsError);
    const err = new Error('Failed to load classes. Please try again.');
    err.statusCode = 500;
    err.publicMessage = 'Failed to load classes. Please try again.';
    throw err;
  }

  const enrolledClassIds = new Set(enrollmentsData.map(e => e.class_id));

  // Step D: Merge all into final array
  return classesData.map(c => ({
    id: c.id,
    name: c.name,
    subject: c.subject,
    teacher_name: teacherMap[c.teacher_id] || 'Unknown Teacher',
    is_enrolled: enrolledClassIds.has(c.id)
  }));
};
