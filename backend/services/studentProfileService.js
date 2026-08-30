import supabaseAdmin from '../lib/supabaseAdmin.js';

export const updateStudentProfile = async (studentId, subject, topic, isCorrect) => {
  try {
    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from('student_profiles')
      .select('*')
      .eq('student_id', studentId)
      .eq('subject', subject)
      .eq('topic', topic)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (existingProfile) {
      const attemptCount = existingProfile.attempt_count;
      const weight = 1 / (attemptCount + 1);
      
      let newStrength = existingProfile.strength_score;
      let newGap = existingProfile.gap_score;

      if (isCorrect) {
        newStrength = Math.min(1.00, newStrength + weight);
        newGap = Math.max(0.00, newGap - weight);
      } else {
        newStrength = Math.max(0.00, newStrength - (weight * 0.5));
        newGap = Math.min(1.00, newGap + (weight * 0.5));
      }

      newStrength = Math.round(newStrength * 100) / 100;
      newGap = Math.round(newGap * 100) / 100;

      const { error: updateError } = await supabaseAdmin
        .from('student_profiles')
        .update({
          strength_score: newStrength,
          gap_score: newGap,
          attempt_count: attemptCount + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProfile.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      const { error: insertError } = await supabaseAdmin
        .from('student_profiles')
        .insert([{
          student_id: studentId,
          subject,
          topic,
          attempt_count: 1,
          strength_score: isCorrect ? 0.70 : 0.10,
          gap_score: isCorrect ? 0.10 : 0.70
        }]);

      if (insertError) {
        throw insertError;
      }
    }
  } catch (err) {
    console.error('[studentProfileService.updateStudentProfile] Error:', err);
    const error = new Error('Failed to update your progress.');
    error.statusCode = 500;
    error.publicMessage = 'Failed to update your progress. Please try again.';
    throw error;
  }
};
