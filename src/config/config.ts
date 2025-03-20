import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  port: number;
  nodeEnv: string;
  linkedin: {
    clientId: string;
    clientSecret: string;
    secondClientSecret: string | null;
    redirectUri: string;
  };
}

const config: Config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID ?? '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET ?? '',
    secondClientSecret: process.env.LINKEDIN_SECOND_CLIENT_SECRET ?? null,
    redirectUri: process.env.LINKEDIN_REDIRECT_URI ?? '',
  },
};

export default config;
