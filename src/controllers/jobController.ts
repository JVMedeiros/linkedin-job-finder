import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import linkedinService from '../services/linkedinService';
import { LinkedInJobSearchParams } from '../interfaces/linkedin';
import console from 'console';

class JobController {
  async searchJobs(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      if (!req.session?.linkedInAccessToken) {
        res.status(401).json({ error: 'Not authenticated. Please log in first.' });
        return;
      }

      const searchParams: LinkedInJobSearchParams = {
        keywords: req.query.keywords as string,
        location: req.query.location as string,
        locationId: req.query.locationId as string,
        distance: req.query.distance ? parseInt(req.query.distance as string, 10) : undefined,
        jobFunction: req.query.jobFunction ? (req.query.jobFunction as string).split(',') : undefined,
        industries: req.query.industries ? (req.query.industries as string).split(',') : undefined,
        experienceLevel: req.query.experienceLevel ? (req.query.experienceLevel as string).split(',') : undefined,
        jobType: req.query.jobType ? (req.query.jobType as string).split(',') : undefined,
        start: req.query.start ? parseInt(req.query.start as string, 10) : 0,
        count: req.query.count ? parseInt(req.query.count as string, 10) : 10,
        sortBy: req.query.sortBy as 'relevance' | 'date',
        sortDirection: req.query.sortDirection as 'ASCENDING' | 'DESCENDING',
        timeFilter: req.query.timeFilter as string,
        title: req.query.title as string
      };

      const jobs = await linkedinService.searchJobs(searchParams, req.session.linkedInAccessToken);
      
      res.json(jobs);
    } catch (error) {
      console.error('Error searching for jobs:', error);
      res.status(500).json({ error: 'Failed to search for jobs' });
    }
  }

  async getJobDetails(req: Request, res: Response): Promise<void> {
    try {
      if (!req.session?.linkedInAccessToken) {
        res.status(401).json({ error: 'Not authenticated. Please log in first.' });
        return;
      }

      const jobUrn = req.params.id;
      
      const jobDetails = await linkedinService.getJobDetails(jobUrn, req.session.linkedInAccessToken);
      
      res.json(jobDetails);
    } catch (error) {
      console.error(`Error getting job details for job ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to get job details' });
    }
  }
}

export default new JobController();
