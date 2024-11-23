import express from 'express';
import { PrismaClient } from '@prisma/client';
const router = express.Router();
const prisma = new PrismaClient();
// Get user's achievements
router.get('/', async (req, res) => {
  try {
    const achievements = await prisma.achievement.findMany({
      where: {
        userId: req.user.userId
      }
    });
    res.json(achievements);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
export default router;
