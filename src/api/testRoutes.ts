import { Router, RequestHandler } from 'express';
import { LinkedInJob, LinkedInJobSearchResponse } from '../interfaces/linkedin';

const router = Router();

// Mock de resposta para testes
const generateMockJobs = (query: any): LinkedInJobSearchResponse => {
  const title = query.title || '';
  const keywords = query.keywords || '';
  
  // Mock Fake Jobs
  const mockJobs: LinkedInJob[] = [
    {
      entityUrn: 'urn:li:job:1',
      title: 'Desenvolvedor Node.js Senior',
      description: {
        text: 'Estamos procurando um desenvolvedor Node.js experiente para se juntar à nossa equipe.'
      },
      formattedLocation: 'São Paulo, Brasil',
      company: {
        name: 'Tech Solutions',
        logoUrl: 'https://example.com/logo.png'
      },
      listedAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 dias atrás
      experienceLevel: 'Senior',
      workType: 'FULL_TIME'
    },
    {
      entityUrn: 'urn:li:job:2',
      title: 'Desenvolvedor React Frontend',
      description: {
        text: 'Procuramos um desenvolvedor React para trabalhar em projetos de UI/UX.'
      },
      formattedLocation: 'Rio de Janeiro, Brasil',
      company: {
        name: 'Creative Web',
        logoUrl: 'https://example.com/logo2.png'
      },
      listedAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 dias atrás
      experienceLevel: 'Pleno',
      workType: 'FULL_TIME'
    },
    {
      entityUrn: 'urn:li:job:3',
      title: 'Engenheiro DevOps',
      description: {
        text: 'Venha trabalhar com infraestrutura e automação em nossa empresa.'
      },
      formattedLocation: 'Remoto',
      company: {
        name: 'Cloud Solutions',
        logoUrl: 'https://example.com/logo3.png'
      },
      listedAt: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 dia atrás
      experienceLevel: 'Pleno',
      workType: 'FULL_TIME'
    },
    {
      entityUrn: 'urn:li:job:4',
      title: 'Desenvolvedor TypeScript Full Stack',
      description: {
        text: 'Desenvolvedor com conhecimento em Node.js, React e bancos de dados.'
      },
      formattedLocation: 'Belo Horizonte, Brasil',
      company: {
        name: 'Startup Inovadora',
        logoUrl: 'https://example.com/logo4.png'
      },
      listedAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 dias atrás
      experienceLevel: 'Pleno/Senior',
      workType: 'FULL_TIME'
    }
  ];

  let filteredJobs = [...mockJobs];
  
  if (title) {
    filteredJobs = filteredJobs.filter(job => 
      job.title.toLowerCase().includes(title.toLowerCase())
    );
  }
  
  if (keywords) {
    filteredJobs = filteredJobs.filter(job => 
      job.title.toLowerCase().includes(keywords.toLowerCase()) || 
      job.description?.text?.toLowerCase().includes(keywords.toLowerCase()) ||
      job.company?.name.toLowerCase().includes(keywords.toLowerCase())
    );
  }

  return {
    paging: {
      count: filteredJobs.length,
      start: 0,
      total: filteredJobs.length
    },
    elements: filteredJobs
  };
};

const searchJobsHandler: RequestHandler = (req, res) => {
  const mockResponse = generateMockJobs(req.query);
  res.json(mockResponse);
};

router.get('/test/jobs', searchJobsHandler);

const jobDetailHandler: RequestHandler = (req, res) => {
  const jobId = req.params.id;
  const mockJobs = generateMockJobs({}).elements;
  
  const job = mockJobs.find(job => job.entityUrn === `urn:li:job:${jobId}` || job.entityUrn === jobId);
  
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  
  res.json(job);
};

router.get('/test/jobs/:id', jobDetailHandler);

const healthCheckHandler: RequestHandler = (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
};

router.get('/test/health', healthCheckHandler);

export default router;
