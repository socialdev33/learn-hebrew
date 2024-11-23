import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './middleware/auth.js';
import achievementsRouter from './routes/achievements.js';
import goalsRouter from './routes/goals.js';
import authRouter from './routes/auth.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:5173',
  credentials: true
}));

// Request parsing
app.use(express.json());
app.disable('x-powered-by');

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database not connected' });
  }
});

// Configuration test endpoint
app.get('/api/config-test', (req, res) => {
  const config = {
    dbConnected: !!process.env.DATABASE_URL,
    jwtConfigured: !!process.env.JWT_SECRET,
    port: process.env.PORT,
    environment: process.env.NODE_ENV,
    frontendUrl: process.env.FRONTEND_URL
  };

  res.json({
    configured: {
      database: config.dbConnected ? "✅" : "❌",
      jwt: config.jwtConfigured ? "✅" : "❌",
      port: config.port ? "✅" : "❌",
      environment: config.environment ? "✅" : "❌",
      frontend: config.frontendUrl ? "✅" : "❌"
    }
  });
});

// Auth routes (public)
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/achievements', authenticateToken, achievementsRouter);
app.use('/api/goals', authenticateToken, goalsRouter);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
});

export default app;