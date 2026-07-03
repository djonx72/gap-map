import * as dotenv from 'dotenv';
dotenv.config();
import { analyzeAnswer } from './services/aiService.js';

const result = await analyzeAnswer({
  submission_id: 'test-003',
  subject: 'English',
  topic: 'Identifying Verbs',
  difficulty: 'easy',
  question: 'Identify the verb in this sentence: "The dog quickly ran across the yard."',
  correct_answer: 'ran',
  student_answer: '',
  question_type: 'short'
});
console.log(JSON.stringify(result, null, 2));