import express, { Request, Response } from 'express';
import path from 'path';
import cookieSession from 'cookie-session';
import routes from './api/routes';
import testRoutes from './api/testRoutes';
import config from './config/config';

// Initialize express app
const app = express();

// Configure middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure session middleware
app.use(cookieSession({
  name: 'linkedin-session',
  keys: ['key1', 'key2'], // You should use more secure keys in production
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  secure: config.nodeEnv === 'production',
  httpOnly: true
}));

app.use(express.static(path.join(__dirname, '../public')));

app.use(routes);
app.use(testRoutes);

app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/jobs', (req: Request, res: Response) => {
  if (!req.session?.linkedInAccessToken) {
    return res.redirect('/auth/linkedin');
  }
  res.sendFile(path.join(__dirname, '../public/jobs.html'));
});

app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: config.nodeEnv === 'development' ? err.message : undefined
  });
});

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
