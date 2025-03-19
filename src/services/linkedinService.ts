import axios from 'axios';
import rateLimit from 'axios-rate-limit';
import config from '../config/config';
import { 
  LinkedInTokenResponse, 
  LinkedInProfile, 
  LinkedInJobSearchParams, 
  LinkedInJobSearchResponse 
} from '../interfaces/linkedin';

// Create rate-limited axios instance to prevent hitting LinkedIn API limits
const http = rateLimit(axios.create(), { maxRequests: 5, perMilliseconds: 1000 });

// LinkedIn API URLs
const LINKEDIN_API_URL = process.env.LINKEDIN_API_URL
const LINKEDIN_OAUTH_URL = process.env.LINKEDIN_OAUTH_URL

class LinkedInService {
  private accessToken: string | null = null;
  private accessTokenExpiry: number = 0;

  /**
   * Exchange authorization code for an access token
   * @param authCode Authorization code from LinkedIn OAuth flow
   * @returns TokenResponse containing access_token and other info
   */
  async getAccessToken(authCode: string): Promise<LinkedInTokenResponse> {
    try {
      const response = await http.post(
        `${LINKEDIN_OAUTH_URL}/accessToken`,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: authCode,
          client_id: config.linkedin.clientId,
          client_secret: config.linkedin.clientSecret,
          redirect_uri: config.linkedin.redirectUri,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.accessTokenExpiry = Date.now() + (response.data.expires_in * 1000);
      
      return response.data;
    } catch (error) {
      console.error('Error getting LinkedIn access token:', error);
      throw new Error('Failed to obtain LinkedIn access token');
    }
  }

  /**
   * Get user profile information from LinkedIn
   * @param accessToken LinkedIn access token
   * @returns User profile information
   */
  async getUserProfile(accessToken?: string): Promise<LinkedInProfile> {
    const token = accessToken ?? this.accessToken;
    
    if (!token) {
      throw new Error('Access token is required to fetch user profile');
    }

    try {
      // Get basic profile information
      const profileResponse = await http.get(
        `${LINKEDIN_API_URL}/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Get user email address in a separate request
      const emailResponse = await http.get(
        `${LINKEDIN_API_URL}/emailAddress?q=members&projection=(elements*(handle~))`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const profile = profileResponse.data;
      const emailAddress = emailResponse.data.elements?.[0]?.['handle~']?.emailAddress ?? null;

      return {
        id: profile.id,
        localizedFirstName: profile.localizedFirstName,
        localizedLastName: profile.localizedLastName,
        profilePicture: profile.profilePicture ? {
          displayImage: profile.profilePicture['displayImage~'].elements[0].identifiers[0].identifier
        } : undefined,
        emailAddress
      };
    } catch (error) {
      console.error('Error fetching LinkedIn profile:', error);
      throw new Error('Failed to fetch LinkedIn profile');
    }
  }

  /**
   * Search for jobs on LinkedIn
   * @param params Search parameters
   * @param accessToken LinkedIn access token
   * @returns Job search results
   */
  async searchJobs(params: LinkedInJobSearchParams, accessToken?: string): Promise<LinkedInJobSearchResponse> {
    const token = accessToken ?? this.accessToken;
    
    if (!token) {
      throw new Error('Access token is required to search for jobs');
    }

    try {
      // Using LinkedIn's Job Search API (Marketing Developer Platform)
      const response = await http.get(
        `${LINKEDIN_API_URL}/jobSearch`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
          params: {
            keywords: params.keywords,
            location: params.location,
            locationId: params.locationId,
            distance: params.distance ?? 25,
            start: params.start ?? 0,
            count: params.count ?? 10,
            sortBy: params.sortBy ?? 'relevance',
            sortDirection: params.sortDirection ?? 'DESCENDING',
            title: params.title, // Adicionando filtro por título
            // Add more parameters as needed based on LinkedIn's API documentation
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error searching for jobs on LinkedIn:', error);
      throw new Error('Failed to search for jobs on LinkedIn');
    }
  }

  /**
   * Get details of a specific job on LinkedIn
   * @param jobUrn LinkedIn job URN
   * @param accessToken LinkedIn access token
   * @returns Job details
   */
  async getJobDetails(jobUrn: string, accessToken?: string): Promise<any> {
    const token = accessToken ?? this.accessToken;
    
    if (!token) {
      throw new Error('Access token is required to get job details');
    }

    try {
      // Format the URN if needed
      const formattedUrn = jobUrn.startsWith('urn:li:') ? jobUrn : `urn:li:job:${jobUrn}`;
      
      const response = await http.get(
        `${LINKEDIN_API_URL}/jobs/${encodeURIComponent(formattedUrn)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Restli-Protocol-Version': '2.0.0',
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error(`Error fetching details for job ${jobUrn}:`, error);
      throw new Error('Failed to fetch job details');
    }
  }

  /**
   * Check if the current access token is valid
   * @returns boolean indicating if the token is valid
   */
  isAccessTokenValid(): boolean {
    return !!this.accessToken && Date.now() < this.accessTokenExpiry;
  }
}

export default new LinkedInService();
