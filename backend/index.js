import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import supabase, {supabaseAdmin} from './config/supabase.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'GapMap backend is running', status: 'ok' });
});


app.listen(PORT, () => {
  console.log(`GapMap backend running on port ${PORT}`);
});