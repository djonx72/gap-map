import supabaseAdmin from '../lib/supabaseAdmin.js';
import { verifyStudentEnrollment } from './classService.js';
import { updateStudentProfile } from './studentProfileService.js';
import { analyseAnswer } from '../ai/analyseAnswer.js';

export const processQuizSubmission = async (studentId, answers) => {
  const results = [];

  for (const answer of answers) {
    try {
      const { question_id, answer_content } = answer;
      const cleanAnswer = typeof answer_content === 'string' ? answer_content.trim() : '';

      // a. Fetch the full question
      const { data: question, error: questionError } = await supabaseAdmin
        .from('questions')
        .select('id, class_id, topic, type, difficulty, content, correct_answer, options')
        .eq('id', question_id)
        .maybeSingle();

      if (questionError || !question) {
        console.warn(`[processQuizSubmission] Question not found or DB error: ${question_id}`);
        continue;
      }

      // b. ENROLLMENT CHECK
      try {
        await verifyStudentEnrollment(question.class_id, studentId);
      } catch (err) {
        console.warn(`[processQuizSubmission] Enrollment check failed for studentId: ${studentId}, question_id: ${question_id}, classId: ${question.class_id}`);
        continue;
      }

      // c. Fetch the class's subject
      const { data: classData, error: classError } = await supabaseAdmin
        .from('classes')
        .select('subject')
        .eq('id', question.class_id)
        .maybeSingle();

      const subject = (classData && classData.subject) ? classData.subject : 'General';

      // d. DUPLICATE CHECK
      const { data: existingSubmission, error: submissionQueryError } = await supabaseAdmin
        .from('submissions')
        .select('id, answer_content')
        .eq('question_id', question_id)
        .eq('student_id', studentId)
        .maybeSingle();

      if (submissionQueryError) {
        console.error(`[processQuizSubmission] Error checking duplicates for question_id: ${question_id}`);
        continue;
      }

      let submission_id;
      let finalAnswerContent = cleanAnswer;

      if (existingSubmission) {
        const { data: existingAnalysis, error: analysisQueryError } = await supabaseAdmin
          .from('ai_analyses')
          .select('id')
          .eq('submission_id', existingSubmission.id)
          .maybeSingle();

        if (analysisQueryError) {
          console.error(`[processQuizSubmission] Error checking ai_analyses for submission_id: ${existingSubmission.id}`);
          continue;
        }

        if (existingAnalysis) {
          console.warn(`[processQuizSubmission] Genuine duplicate skipped — already analyzed. studentId: ${studentId}, question_id: ${question_id}`);
          continue;
        }

        console.warn(`[processQuizSubmission] Retrying incomplete submission — no prior analysis found. studentId: ${studentId}, question_id: ${question_id}`);
        submission_id = existingSubmission.id;
        finalAnswerContent = existingSubmission.answer_content;
      } else {
        // e. Insert into submissions
        const { data: newSubmission, error: insertError } = await supabaseAdmin
          .from('submissions')
          .insert([{
            question_id,
            student_id: studentId,
            answer_content: cleanAnswer
          }])
          .select('id')
          .single();

        if (insertError) {
          console.error(`[processQuizSubmission] Failed to insert submission for question_id: ${question_id}`, insertError);
          continue;
        }

        submission_id = newSubmission.id;
      }

      // f. Call analyseAnswer
      let aiResult;
      try {
        aiResult = await analyseAnswer({
          submission_id,
          subject,
          topic: question.topic,
          difficulty: question.difficulty,
          question: question.content,
          correct_answer: question.correct_answer,
          student_answer: finalAnswerContent,
          question_type: question.type,
          options: question.options || []
        });
      } catch (err) {
        console.error(`[processQuizSubmission] AI call failed for question_id: ${question_id}`, err);
        continue;
      }

      // g. Insert into ai_analyses
      const { error: aiInsertError } = await supabaseAdmin
        .from('ai_analyses')
        .insert([{
          submission_id,
          is_correct: aiResult.is_correct,
          root_gap: aiResult.root_gap,
          explanation: aiResult.explanation,
          teacher_report: aiResult.teacher_report,
          confidence_score: aiResult.confidence_score
        }]);

      if (aiInsertError) {
        console.error(`[processQuizSubmission] Failed to insert ai_analysis for submission_id: ${submission_id}`, aiInsertError);
        continue;
      }

      // h. Call updateStudentProfile
      try {
        await updateStudentProfile(studentId, subject, question.topic, aiResult.is_correct);
      } catch (err) {
        console.error(`[processQuizSubmission] Failed to update student profile for studentId: ${studentId}, topic: ${question.topic}`, err);
      }

      // i. Push to results (strictly excluding teacher_report)
      results.push({
        question_id,
        question_text: question.content,
        question_type: question.type,
        topic: question.topic,
        student_answer: finalAnswerContent,
        is_correct: aiResult.is_correct,
        root_gap: aiResult.root_gap,
        explanation: aiResult.explanation,
        confidence_score: aiResult.confidence_score
      });

    } catch (err) {
      console.error(`[processQuizSubmission] Unexpected error processing answer for question_id: ${answer?.question_id}`, err);
      continue;
    }
  }

  return results;
};

export const getSubmissionStatus = async (classId, studentId) => {
  await verifyStudentEnrollment(classId, studentId);

  const { data: questions, error: questionsError } = await supabaseAdmin
    .from('questions')
    .select('id')
    .eq('class_id', classId);

  if (questionsError) {
    console.error('[submissionService.getSubmissionStatus] questions DB error:', questionsError);
    const err = new Error('Failed to check quiz status.');
    err.statusCode = 500;
    err.publicMessage = 'Failed to check quiz status. Please try again.';
    throw err;
  }

  const total = questions.length;
  if (total === 0) {
    return { completed: false, answered: 0, total: 0 };
  }

  const questionIds = questions.map(q => q.id);

  const { data: submissions, error: submissionsError } = await supabaseAdmin
    .from('submissions')
    .select('id')
    .eq('student_id', studentId)
    .in('question_id', questionIds);

  if (submissionsError) {
    console.error('[submissionService.getSubmissionStatus] submissions DB error:', submissionsError);
    const err = new Error('Failed to check quiz status.');
    err.statusCode = 500;
    err.publicMessage = 'Failed to check quiz status. Please try again.';
    throw err;
  }

  if (submissions.length === 0) {
    return { completed: false, answered: 0, total };
  }

  const submissionIds = submissions.map(s => s.id);

  const { data: aiAnalyses, error: analysesError } = await supabaseAdmin
    .from('ai_analyses')
    .select('submission_id')
    .in('submission_id', submissionIds);

  if (analysesError) {
    console.error('[submissionService.getSubmissionStatus] ai_analyses DB error:', analysesError);
    const err = new Error('Failed to check quiz status.');
    err.statusCode = 500;
    err.publicMessage = 'Failed to check quiz status. Please try again.';
    throw err;
  }

  const analyzedIds = new Set(aiAnalyses.map(a => a.submission_id));
  const answered = submissions.filter(s => analyzedIds.has(s.id)).length;

  return { completed: answered >= total, answered, total };
};
