import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { authenticateToken } from './middleware/auth.js';
import achievementsRouter from './routes/achievements.js';
import authRouter from './routes/auth.js';
import goalsRouter from './routes/goals.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Health check (public route)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth routes (public routes - no auth required)
app.use('/api/auth', authRouter);

// Protected routes (require authentication)
app.use('/api/achievements', authenticateToken, achievementsRouter);
app.use('/api/goals', authenticateToken, goalsRouter);

// Rate limiting middleware (optional but recommended)
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
};

app.use('/api/', rateLimit);

// Global error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message 
  });
});

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;