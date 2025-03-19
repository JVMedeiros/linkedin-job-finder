import { Request, Response } from 'express';
import linkedinService from '../services/linkedinService';
import config from '../config/config';

class AuthController {
  /**
   * Redirect user to LinkedIn OAuth authorization page
   */
  getLoginUrl(req: Request, res: Response): void {
    const scope = 'r_liteprofile r_emailaddress';
    const state = Math.random().toString(36).substring(2, 15);
    
    // Store state in session or cookie to prevent CSRF attacks
    req.session = req.session || {};
    req.session.linkedInState = state;
    
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${config.linkedin.clientId}&redirect_uri=${encodeURIComponent(config.linkedin.redirectUri)}&state=${state}&scope=${encodeURIComponent(scope)}`;
    
    res.redirect(authUrl);
  }

  /**
   * Handle LinkedIn OAuth callback
   */
  async handleCallback(req: Request, res: Response): Promise<void> {
    const { code, state, error } = req.query;
    
    // Check for error
    if (error) {
      res.status(400).json({ error: error });
      return;
    }
    
    // Verify state to prevent CSRF attacks
    req.session = req.session || {};
    if (state !== req.session.linkedInState) {
      res.status(403).json({ error: 'Invalid state parameter' });
      return;
    }
    
    try {
      // Exchange authorization code for access token
      const tokenResponse = await linkedinService.getAccessToken(code as string);
      
      // Get user profile
      const userProfile = await linkedinService.getUserProfile(tokenResponse.access_token);
      
      // Store token and user info in session
      req.session.linkedInAccessToken = tokenResponse.access_token;
      req.session.linkedInUser = userProfile;
      
      // Redirect to jobs page or return token to the client
      res.redirect('/jobs');
    } catch (error) {
      console.error('LinkedIn authentication error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  }

  /**
   * Logout user and invalidate session
   */
  logout(req: Request, res: Response): void {
    req.session = null;
    res.redirect('/');
  }
}

export default new AuthController();
