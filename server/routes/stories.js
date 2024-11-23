import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const paginationSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  limit: z.string().transform(val => parseInt(val) || 10)
});

const submitProgressSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    answer: z.string()
  })),
  timeSpent: z.number().positive()
});

// Utility functions
const calculateXPAndLevel = async (userId, score, storyPoints) => {
  const xpGained = Math.round(score * (storyPoints / 100));
  const user = await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: xpGained } }
  });

  let newLevel = user.level;
  if (user.xp >= 2500 && user.level === 'intermediate') {
    newLevel = 'advanced';
  } else if (user.xp >= 1000 && user.level === 'beginner') {
    newLevel = 'intermediate';
  }

  if (newLevel !== user.level) {
    await prisma.user.update({
      where: { id: userId },
      data: { level: newLevel }
    });
  }

  return { xpGained, levelUp: newLevel !== user.level ? newLevel : null };
};

const calculateQuizScore = (answers, questions) => {
  const correctAnswers = answers.reduce((count, answer) => {
    const question = questions.find(q => q.id === answer.questionId);
    return question?.answer === answer.answer ? count + 1 : count;
  }, 0);

  return Math.round((correctAnswers / answers.length) * 100);
};

// Request handlers
const getStories = async (req, res) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { level: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [stories, total] = await Promise.all([
      prisma.story.findMany({
        where: { 
          OR: [{ level: user.level }, { level: 'all' }]
        },
        include: {
          vocabulary: true,
          quiz: {
            include: {
              questions: {
                select: {
                  id: true,
                  question: true,
                  options: true
                }
              }
            }
          },
          _count: {
            select: { progress: true }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.story.count({
        where: {
          OR: [{ level: user.level }, { level: 'all' }]
        }
      })
    ]);

    res.json({
      stories,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page,
        perPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(error.status || 400).json({ 
      message: 'Error fetching stories',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getStoryDetails = async (req, res) => {
  try {
    const story = await prisma.story.findUnique({
      where: { id: req.params.id },
      include: {
        vocabulary: true,
        quiz: {
          include: {
            questions: true
          }
        },
        progress: {
          where: { userId: req.user.userId }
        }
      }
    });

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    const userProgress = await prisma.storyProgress.findUnique({
      where: {
        userId_storyId: {
          userId: req.user.userId,
          storyId: story.id
        }
      }
    });

    res.json({
      ...story,
      userProgress: userProgress || { completed: false, score: 0 }
    });
  } catch (error) {
    console.error('Error fetching story details:', error);
    res.status(error.status || 400).json({ 
      message: 'Error fetching story details',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const submitProgress = async (req, res) => {
  try {
    const { answers, timeSpent } = submitProgressSchema.parse(req.body);

    const story = await prisma.story.findUnique({
      where: { id: req.params.id },
      include: {
        quiz: {
          include: {
            questions: true
          }
        }
      }
    });

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    const score = calculateQuizScore(answers, story.quiz.questions);

    const [progress, xpUpdate] = await Promise.all([
      prisma.storyProgress.upsert({
        where: {
          userId_storyId: {
            userId: req.user.userId,
            storyId: story.id
          }
        },
        update: {
          completed: true,
          score,
          timeSpent,
          attempts: { increment: 1 }
        },
        create: {
          userId: req.user.userId,
          storyId: story.id,
          completed: true,
          score,
          timeSpent,
          attempts: 1
        }
      }),
      calculateXPAndLevel(req.user.userId, score, story.points)
    ]);

    res.json({
      progress,
      ...xpUpdate
    });
  } catch (error) {
    console.error('Error submitting progress:', error);
    res.status(error.status || 400).json({ 
      message: 'Error submitting progress',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getStats = async (req, res) => {
  try {
    const [stats, recentProgress] = await Promise.all([
      prisma.storyProgress.aggregate({
        where: {
          userId: req.user.userId,
          completed: true
        },
        _count: true,
        _avg: {
          score: true,
          timeSpent: true
        },
        _sum: {
          attempts: true
        }
      }),
      prisma.storyProgress.findMany({
        where: {
          userId: req.user.userId,
          completed: true
        },
        include: {
          story: true
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: 5
      })
    ]);

    res.json({
      stats,
      recentProgress
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(error.status || 400).json({ 
      message: 'Error fetching stats',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Routes
router.get('/', getStories);
router.get('/:id', getStoryDetails);
router.post('/:id/submit', submitProgress);
router.get('/stats/overview', getStats);

export default router;