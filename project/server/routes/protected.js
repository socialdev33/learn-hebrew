import express from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Example of a protected route that any authenticated user can access
router.get('/profile', authenticateToken, (req, res) => {
  // req.user contains the authenticated user's information
  res.json({
    message: "Profile accessed successfully",
    user: req.user
  });
});

// Example of an admin-only route
router.get('/admin-dashboard', 
  authenticateToken, 
  authorizeRole('admin'), 
  (req, res) => {
    res.json({
      message: "Admin dashboard accessed successfully",
      adminData: "Secret admin data"
    });
});

export default router;