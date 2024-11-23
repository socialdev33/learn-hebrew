import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import achievementsRouter from './routes/achievements.js';
import goalsRouter from './routes/goals.js';
import { authenticateToken } from './middleware/auth.js';

// Initialize Prisma
const prisma = new PrismaClient();
const debug = (...args) => console.log('[DEBUG]', ...args);

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware setup
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  debug(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/achievements', authenticateToken, achievementsRouter);
app.use('/api/goals', authenticateToken, goalsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.path
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  debug('Error:', err);

  // Prisma error handling
  if (err?.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({ 
      message: 'Database error',
      code: err.code
    });
  }

  // JWT error handling
  if (err?.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      message: 'Invalid token'
    });
  }

  // Generic error response
  res.status(err.status || 500).json({ 
    message: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  debug('SIGTERM received. Shutting down gracefully...');
  prisma.$disconnect();
  server.close(() => {
    debug('Server closed');
    process.exit(0);
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  debug(`Server running on port ${PORT}`);
  debug(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;