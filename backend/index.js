import './config/env.js';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'GapMap backend is running', status: 'ok' });
});

// Routes
app.use('/auth', authRoutes);

// Error handling middleware (must be registered last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`GapMap backend running on port ${PORT}`);
});