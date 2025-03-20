import { Request, Response } from 'express';
import linkedinService from '../services/linkedinService';
import config from '../config/config';

class AuthController {
  getLoginUrl(req: Request, res: Response): void {
    const scope = '_jobs r_liteprofile r_emailaddress';
    const state = Math.random().toString(36).substring(2, 15);
    
    req.session = req.session || {};
    req.session.linkedInState = state;
    
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${config.linkedin.clientId}&redirect_uri=${encodeURIComponent(config.linkedin.redirectUri)}&state=${state}&scope=${encodeURIComponent(scope)}`;
    
    res.redirect(authUrl);
  }
  async handleCallback(req: Request, res: Response): Promise<void> {
    const { code, state, error } = req.query;
    
    if (error) {
      res.status(400).json({ error: error });
      return;
    }
    
    req.session = req.session || {};
    if (state !== req.session.linkedInState) {
      res.status(403).json({ error: 'Invalid state parameter' });
      return;
    }
    
    try {
      const tokenResponse = await linkedinService.getAccessToken(code as string);
      
      const userProfile = await linkedinService.getUserProfile(tokenResponse.access_token);
      
      req.session.linkedInAccessToken = tokenResponse.access_token;
      req.session.linkedInUser = userProfile;
      
      res.redirect('/');
    } catch (error) {
      console.error('LinkedIn callback error:', error);
      res.status(500).json({ error: 'Failed to authenticate with LinkedIn' });
    }
  }

  logout(req: Request, res: Response): void {
    req.session = null;
    res.redirect('/');
  }
}

export default new AuthController();
