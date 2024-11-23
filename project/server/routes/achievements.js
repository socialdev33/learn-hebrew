import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod'; // Add input validation

const router = express.Router();
const prisma = new PrismaClient();

// Achievement types enum
const ACHIEVEMENT_TYPES = {
  WEEK_STREAK: 'week_streak',
  STORIES_10: 'stories_10',
  PERFECT_5: 'perfect_5'
};

// Get user's achievements
router.get('/', async (req, res) => {
  try {
    const achievements = await prisma.achievement.findMany({
      where: {
        userId: req.user.userId
      },
      select: {
        id: true,
        type: true,
        name: true,
        description: true,
        category: true,
        progress: true,
        unlocked: true,
        unlockedAt: true,
        xpReward: true
      },
      orderBy: {
        unlockedAt: 'desc'
      }
    });

    res.json(achievements);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ message: 'Failed to fetch achievements' });
  }
});

// Check and award achievements
export async function checkAchievements(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        storyProgress: true,
        practiceResults: true,
        achievements: {
          select: {
            type: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const existingAchievementTypes = new Set(user.achievements.map(a => a.type));
    const newAchievements = [];

    // Helper function to calculate progress
    const calculateProgress = (current, target) => Math.min((current / target) * 100, 100);

    // Check streak achievement
    if (!existingAchievementTypes.has(ACHIEVEMENT_TYPES.WEEK_STREAK)) {
      const streakProgress = calculateProgress(user.streak, 7);
      newAchievements.push({
        type: ACHIEVEMENT_TYPES.WEEK_STREAK,
        name: 'Week Warrior',
        description: 'Maintained a 7-day learning streak',
        category: 'streak',
        progress: streakProgress,
        unlocked: user.streak >= 7,
        xpReward: 100
      });
    }

    // Check stories completed achievement
    const completedStories = user.storyProgress.filter(p => p.completed).length;
    if (!existingAchievementTypes.has(ACHIEVEMENT_TYPES.STORIES_10)) {
      const storiesProgress = calculateProgress(completedStories, 10);
      newAchievements.push({
        type: ACHIEVEMENT_TYPES.STORIES_10,
        name: 'Story Master',
        description: 'Completed 10 stories',
        category: 'reading',
        progress: storiesProgress,
        unlocked: completedStories >= 10,
        xpReward: 200
      });
    }

    // Check perfect score achievement
    const perfectScores = user.storyProgress.filter(p => p.score === 100).length;
    if (!existingAchievementTypes.has(ACHIEVEMENT_TYPES.PERFECT_5)) {
      const perfectProgress = calculateProgress(perfectScores, 5);
      newAchievements.push({
        type: ACHIEVEMENT_TYPES.PERFECT_5,
        name: 'Perfectionist',
        description: 'Achieved perfect score in 5 stories',
        category: 'accuracy',
        progress: perfectProgress,
        unlocked: perfectScores >= 5,
        xpReward: 300
      });
    }

    // Award new achievements using a transaction
    const unlockedAchievements = newAchievements.filter(a => a.unlocked);
    if (unlockedAchievements.length > 0) {
      await prisma.$transaction(async (tx) => {
        // Create all achievements
        await tx.achievement.createMany({
          data: unlockedAchievements.map(achievement => ({
            ...achievement,
            userId,
            unlockedAt: new Date()
          }))
        });

        // Update user XP
        const totalXPReward = unlockedAchievements.reduce((sum, a) => sum + a.xpReward, 0);
        await tx.user.update({
          where: { id: userId },
          data: {
            xp: {
              increment: totalXPReward
            }
          }
        });
      });
    }

    return newAchievements;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
}

export default router;