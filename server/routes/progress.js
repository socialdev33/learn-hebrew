import express from 'express';
import { PrismaClient } from '@prisma/client';
import { checkAchievements } from './achievements.js';

const router = express.Router();
const prisma = new PrismaClient();

// Constants
const LEVEL_THRESHOLDS = {
  beginner: { min: 0, max: 1000 },
  intermediate: { min: 1000, max: 2500 },
  advanced: { min: 2500, max: 5000 },
  expert: { min: 5000, max: null }
};

const LEVELS = Object.keys(LEVEL_THRESHOLDS);
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Utility functions
const getNextLevel = (currentLevel) => {
  const currentIndex = LEVELS.indexOf(currentLevel);
  return currentIndex < LEVELS.length - 1 ? LEVELS[currentIndex + 1] : null;
};

const calculateLevelProgress = (xp, level) => {
  const threshold = LEVEL_THRESHOLDS[level];
  if (!threshold?.max) return 100;

  const progress = ((xp - threshold.min) / (threshold.max - threshold.min)) * 100;
  return Math.min(100, Math.round(progress));
};

const calculateStats = (user) => {
  if (!user) throw new Error('User data is required');

  const completedStories = user.storyProgress.filter(p => p.completed);
  const totalScore = completedStories.reduce((acc, p) => acc + (p.score || 0), 0);
  const totalPracticeTime = user.practiceResults.reduce((acc, p) => acc + p.timeSpent, 0);

  return {
    totalXP: user.xp,
    streak: user.streak,
    storiesCompleted: completedStories.length,
    averageScore: completedStories.length ? Math.round(totalScore / completedStories.length) : 0,
    practiceTime: totalPracticeTime,
    achievements: user.achievements.length,
    activeGoals: user.goals.length,
    levelProgress: {
      current: user.level,
      xp: user.xp,
      nextLevel: getNextLevel(user.level),
      progress: calculateLevelProgress(user.xp, user.level)
    }
  };
};

const hasStreakBroken = (lastActivity) => {
  if (!lastActivity) return false;

  const today = new Date();
  const timeDiff = today.getTime() - lastActivity.getTime();
  return timeDiff > MS_PER_DAY;
};

// Request handlers
const getProgressOverview = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        storyProgress: {
          include: {
            story: true
          }
        },
        practiceResults: {
          select: {
            timeSpent: true
          }
        },
        achievements: {
          select: {
            id: true
          }
        },
        goals: {
          where: {
            endDate: {
              gte: new Date()
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [stats, recentActivity] = await Promise.all([
      Promise.resolve(calculateStats(user)),
      prisma.storyProgress.findMany({
        where: { userId: req.user.userId },
        include: {
          story: {
            select: {
              id: true,
              title: true,
              level: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
      })
    ]);

    res.json({
      stats,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching progress overview:', error);
    res.status(error.status || 500).json({
      message: 'Error fetching progress overview',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const updateStreak = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        lastActivity: true,
        streak: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const today = new Date();
    const lastActivity = user.lastActivity ? new Date(user.lastActivity) : null;

    // Only update if it's a new day
    if (!lastActivity || lastActivity.toDateString() !== today.toDateString()) {
      const streakBroken = hasStreakBroken(lastActivity);

      await prisma.user.update({
        where: { id: req.user.userId },
        data: {
          streak: streakBroken ? 1 : user.streak + 1,
          lastActivity: today
        }
      });

      // Check for streak-related achievements
      await checkAchievements(req.user.userId);
    }

    res.json({ 
      success: true,
      streak: streakBroken ? 1 : user.streak + 1
    });
  } catch (error) {
    console.error('Error updating streak:', error);
    res.status(error.status || 500).json({
      message: 'Error updating streak',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Routes
router.get('/overview', getProgressOverview);
router.post('/streak', updateStreak);

export default router;