import { Request, Response, NextFunction } from 'express';
import linkedinService from '../services/linkedinService';

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.session?.linkedInAccessToken) {
    res.status(401).json({ error: 'Unauthorized. Please login with LinkedIn first.' });
    return;
  }

  if (!linkedinService.isAccessTokenValid()) {
    res.redirect('/auth/linkedin');
    return;
  }

  next();
};

export const validateJobSearch = (req: Request, res: Response, next: NextFunction): void => {
  const { keywords, location } = req.query;

  if (!keywords && !location) {
    res.status(400).json({ error: 'At least one search parameter (keywords or location) is required.' });
    return;
  }

  next();
};
