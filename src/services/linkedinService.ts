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

  async getAccessToken(authCode: string): Promise<LinkedInTokenResponse> {
    try {
      return await this.getAccessTokenWithSecret(authCode, config.linkedin.clientSecret);
    } catch (error: any) {
      console.log('Erro na tentativa com client secret primário:', error.message);
      
      if (config.linkedin.secondClientSecret) {
        try {
          console.log('Tentando com client secret secundário...');
          return await this.getAccessTokenWithSecret(authCode, config.linkedin.secondClientSecret);
        } catch (secondError) {
          console.error('Erro também com client secret secundário:', secondError);
          throw new Error('Falha ao obter token de acesso LinkedIn com ambos client secrets');
        }
      }
      
      throw error;
    }
  }

  private async getAccessTokenWithSecret(authCode: string, clientSecret: string): Promise<LinkedInTokenResponse> {
    const response = await http.post(
      `${LINKEDIN_OAUTH_URL}/accessToken`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: authCode,
        client_id: config.linkedin.clientId,
        client_secret: clientSecret,
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
  }

  async getUserProfile(accessToken?: string): Promise<LinkedInProfile> {
    const token = accessToken ?? this.accessToken;
    
    if (!token) {
      throw new Error('Access token is required to fetch user profile');
    }

    try {
      const profileResponse = await http.get(
        `${LINKEDIN_API_URL}/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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

  async searchJobs(params: LinkedInJobSearchParams, accessToken?: string): Promise<LinkedInJobSearchResponse> {
    const token = accessToken ?? this.accessToken;
    
    if (!token) {
      throw new Error('Access token is required to search for jobs');
    }

    try {
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
            title: params.title,
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error searching for jobs on LinkedIn:', error);
      throw new Error('Failed to search for jobs on LinkedIn');
    }
  }

  async getJobDetails(jobUrn: string, accessToken?: string): Promise<any> {
    const token = accessToken ?? this.accessToken;
    
    if (!token) {
      throw new Error('Access token is required to get job details');
    }

    try {
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
  
  isAccessTokenValid(): boolean {
    return !!this.accessToken && Date.now() < this.accessTokenExpiry;
  }
}

export default new LinkedInService();
