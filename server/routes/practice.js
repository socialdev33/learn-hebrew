import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { checkAchievements } from './achievements.js';
import { checkGoals } from './goals.js';
const router = express.Router();
const prisma = new PrismaClient();

// Constants
const XP_MULTIPLIER = 0.5;
const LONG_PRACTICE_THRESHOLD = 300; // 5 minutes in seconds
const LONG_PRACTICE_BONUS = 25;
const RECENT_HISTORY_SIZE = 10;
const TOTAL_HISTORY_SIZE = 20;
const TOP_MISTAKES_COUNT = 5;

const LEVEL_THRESHOLDS = {
  expert: 5000,
  advanced: 2500,
  intermediate: 1000,
  beginner: 0
};

// Validation schemas
const submitResultSchema = z.object({
  type: z.enum(['speaking', 'writing', 'reading', 'conversation']),
  score: z.number().min(0).max(100),
  timeSpent: z.number().min(0),
  mistakes: z.array(z.string()),
  feedback: z.string().optional()
}).strict();

// Utility functions
const calculateNewLevel = (xp) => {
  const level = Object.entries(LEVEL_THRESHOLDS)
    .find(([, threshold]) => xp >= threshold);
  return level ? level[0] : 'beginner';
};

const calculateXPReward = (score, timeSpent) => {
  let xpReward = Math.round(score * XP_MULTIPLIER);
  if (timeSpent > LONG_PRACTICE_THRESHOLD) {
    xpReward += LONG_PRACTICE_BONUS;
  }
  return xpReward;
};

const calculateAverageScore = (results) => {
  if (!results.length) return 0;
  return results.reduce((acc, r) => acc + r.score, 0) / results.length;
};

const analyzeCommonMistakes = (history) => {
  const mistakeCounts = history
    .flatMap(r => r.mistakes)
    .reduce((acc, mistake) => {
      acc.set(mistake, (acc.get(mistake) || 0) + 1);
      return acc;
    }, new Map());

  return Array.from(mistakeCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, TOP_MISTAKES_COUNT)
    .map(([mistake, count]) => ({ mistake, count }));
};

const calculateTrends = (history) => {
  if (!history.length) {
    return {
      scoreImprovement: 0,
      averageScore: 0,
      totalPracticeTime: 0,
      commonMistakes: []
    };
  }

  const recentResults = history.slice(0, RECENT_HISTORY_SIZE);
  const olderResults = history.slice(RECENT_HISTORY_SIZE, TOTAL_HISTORY_SIZE);

  const recentAvg = calculateAverageScore(recentResults);
  const olderAvg = calculateAverageScore(olderResults);
  const totalPracticeTime = history.reduce((acc, r) => acc + r.timeSpent, 0);

  return {
    scoreImprovement: olderResults.length ? recentAvg - olderAvg : 0,
    averageScore: recentAvg,
    totalPracticeTime,
    commonMistakes: analyzeCommonMistakes(history)
  };
};

// Request handlers
const submitPracticeResult = async (req, res) => {
  try {
    const data = submitResultSchema.parse(req.body);
    const xpReward = calculateXPReward(data.score, data.timeSpent);

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      const practiceResult = await tx.practiceResult.create({
        data: {
          ...data,
          userId: req.user.userId
        }
      });

      const user = await tx.user.update({
        where: { id: req.user.userId },
        data: {
          xp: { increment: xpReward }
        }
      });

      const newLevel = calculateNewLevel(user.xp);
      if (newLevel !== user.level) {
        await tx.user.update({
          where: { id: req.user.userId },
          data: { level: newLevel }
        });
      }

      return {
        practiceResult,
        newLevel: newLevel !== user.level ? newLevel : null
      };
    });

    const newAchievements = await checkAchievements(req.user.userId);

    res.json({
      result: result.practiceResult,
      xpEarned: xpReward,
      levelUp: result.newLevel,
      newAchievements
    });
  } catch (error) {
    console.error('Error submitting practice result:', error);
    res.status(error instanceof z.ZodError ? 400 : 500).json({
      message: 'Error submitting practice result',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getPracticeHistory = async (req, res) => {
  try {
    const history = await prisma.practiceResult.findMany({
      where: {
        userId: req.user.userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: TOTAL_HISTORY_SIZE,
      select: {
        id: true,
        type: true,
        score: true,
        timeSpent: true,
        mistakes: true,
        createdAt: true
      }
    });

    const trends = calculateTrends(history);

    res.json({
      history,
      trends
    });
  } catch (error) {
    console.error('Error fetching practice history:', error);
    res.status(500).json({
      message: 'Error fetching practice history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Routes
router.post('/submit', submitPracticeResult);
router.get('/history', getPracticeHistory);

export default router;