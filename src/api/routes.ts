import { Router } from 'express';
import { validateJobSearch, requireAuth } from '../middleware/authMiddleware';
import authController from '../controllers/authController';
import jobController from '../controllers/jobController';

const router = Router();

// Authentication routes
router.get('/auth/linkedin', authController.getLoginUrl);
router.get('/auth/linkedin/callback', authController.handleCallback);
router.get('/auth/logout', authController.logout);

// Job routes (protected with authentication)
router.get('/api/jobs', requireAuth, validateJobSearch, jobController.searchJobs);
router.get('/api/jobs/:id', requireAuth, jobController.getJobDetails);

// Health check route
router.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default router;
