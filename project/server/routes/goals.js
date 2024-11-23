import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Schema validation
const createGoalSchema = z.object({
  type: z.enum(['daily_xp', 'stories_completed', 'practice_time']),
  target: z.number().min(1),
  endDate: z.string().datetime()
});

// Get user's active goals
router.get('/', async (req, res) => {
  try {
    const goals = await prisma.goal.findMany({
      where: {
        userId: req.user.userId,
        endDate: {
          gte: new Date()
        }
      },
      include: {
        user: {
          select: {
            name: true,
            xp: true
          }
        }
      }
    });

    res.json(goals);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Create new goal
router.post('/', async (req, res) => {
  try {
    const { type, target, endDate } = createGoalSchema.parse(req.body);

    const goal = await prisma.goal.create({
      data: {
        userId: req.user.userId,
        type,
        target,
        progress: 0,
        completed: false,
        endDate: new Date(endDate)
      }
    });

    res.json(goal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update goal progress
router.patch('/:id/progress', async (req, res) => {
  try {
    const { progress } = req.body;
    const goalId = req.params.id;

    const goal = await prisma.goal.findUnique({
      where: { id: goalId }
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    if (goal.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        progress,
        completed: progress >= goal.target
      }
    });

    // If goal completed, award XP
    if (updatedGoal.completed && !goal.completed) {
      await prisma.user.update({
        where: { id: req.user.userId },
        data: {
          xp: {
            increment: 100 // XP reward for completing a goal
          }
        }
      });
    }

    res.json(updatedGoal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete goal
router.delete('/:id', async (req, res) => {
  try {
    const goalId = req.params.id;

    const goal = await prisma.goal.findUnique({
      where: { id: goalId }
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    if (goal.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await prisma.goal.delete({
      where: { id: goalId }
    });

    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get goal statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await prisma.goal.groupBy({
      by: ['type'],
      where: {
        userId: req.user.userId,
        completed: true
      },
      _count: {
        _all: true
      }
    });

    res.json(stats);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;