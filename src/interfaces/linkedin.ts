export interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope?: string;
}

export interface LinkedInProfile {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
  profilePicture?: {
    displayImage: string;
  };
  emailAddress?: string;
}

export interface LinkedInJobSearchParams {
  keywords?: string;
  location?: string;
  locationId?: string;
  distance?: number;
  start?: number;
  count?: number;
  sortBy?: 'relevance' | 'date';
  sortDirection?: 'ASCENDING' | 'DESCENDING';
  jobFunction?: string[];
  industries?: string[];
  experienceLevel?: string[];
  jobType?: string[];
  timeFilter?: string;
  title?: string;  
}

export interface LinkedInJobSearchResponse {
  paging: {
    count: number;
    start: number;
    total: number;
    links?: {
      next?: string;
      previous?: string;
    }
  };
  elements: LinkedInJob[];
}

export interface LinkedInJob {
  entityUrn: string;
  title: string;
  description?: {
    text?: string;
  };
  formattedLocation?: string;
  company?: {
    name: string;
    logoUrl?: string;
    companyUrn?: string;
  };
  listedAt?: number;
  applyMethod?: {
    companyApplyUrl?: string;
  };
  compensationDetails?: {
    salary?: {
      min?: number;
      max?: number;
      currency?: string;
    };
  };
  jobFunctions?: string[];
  industries?: string[];
  experienceLevel?: string;
  workType?: string;
}
