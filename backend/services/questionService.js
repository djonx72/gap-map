import supabaseAdmin from '../lib/supabaseAdmin.js';

export const verifyClassOwnership = async (classId, teacherId) => {
  const { data, error } = await supabaseAdmin
    .from('classes')
    .select('id')
    .eq('id', classId)
    .eq('teacher_id', teacherId)
    .single();

  if (error || !data) {
    if (error && error.code !== 'PGRST116') {
      console.error('[questionService.verifyClassOwnership] DB error:', error);
      const err = new Error('Something went wrong.');
      err.statusCode = 500;
      err.publicMessage = 'Something went wrong. Please try again.';
      throw err;
    }
    const err = new Error('You do not have access to this class.');
    err.statusCode = 403;
    err.publicMessage = 'You do not have access to this class.';
    throw err;
  }
  return true;
};

export const createQuestion = async (teacherId, classId, questionData) => {
  await verifyClassOwnership(classId, teacherId);

  const { topic, type, difficulty, content, correct_answer, options } = questionData;

  const { data, error } = await supabaseAdmin
    .from('questions')
    .insert([{
      class_id: classId,
      teacher_id: teacherId,
      topic,
      type,
      difficulty,
      content,
      correct_answer,
      options: type === 'mcq' ? options : null
    }])
    .select()
    .single();

  if (error) {
    console.error('[questionService.createQuestion] DB error:', error);
    const err = new Error('Failed to create question.');
    err.statusCode = 500;
    err.publicMessage = 'Failed to create question. Please try again.';
    throw err;
  }

  return data;
};

export const getClassQuestions = async (classId, teacherId) => {
  await verifyClassOwnership(classId, teacherId);

  const { data, error } = await supabaseAdmin
    .from('questions')
    .select('*')
    .eq('class_id', classId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[questionService.getClassQuestions] DB error:', error);
    const err = new Error('Failed to fetch questions.');
    err.statusCode = 500;
    err.publicMessage = 'Failed to fetch questions. Please try again.';
    throw err;
  }

  return data || [];
};
