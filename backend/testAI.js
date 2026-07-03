import * as dotenv from 'dotenv';
dotenv.config();
console.log('Key loaded:', process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.slice(0, 6)}...${process.env.GEMINI_API_KEY.slice(-4)}` : 'MISSING');
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