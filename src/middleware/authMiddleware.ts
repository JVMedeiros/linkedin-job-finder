import { Request, Response, NextFunction } from 'express';
import linkedinService from '../services/linkedinService';

/**
 * Middleware to ensure the user is authenticated with LinkedIn
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.session?.linkedInAccessToken) {
    res.status(401).json({ error: 'Unauthorized. Please login with LinkedIn first.' });
    return;
  }

  // Check if the access token is still valid
  if (!linkedinService.isAccessTokenValid()) {
    // Redirect to login if token is invalid
    res.redirect('/auth/linkedin');
    return;
  }

  next();
};

/**
 * Middleware to validate job search parameters
 */
export const validateJobSearch = (req: Request, res: Response, next: NextFunction): void => {
  const { keywords, location } = req.query;

  // Require at least one search parameter
  if (!keywords && !location) {
    res.status(400).json({ error: 'At least one search parameter (keywords or location) is required.' });
    return;
  }

  next();
};
