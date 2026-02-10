import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

console.log('Starting server...');
console.log('Node version:', process.version);
console.log('PORT:', process.env.PORT || 3001);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);

  loadApp();
});

async function loadApp() {
  try {
    
    app.set('trust proxy', 1);

    const parseOrigins = (envVar) => {
      return (envVar || 'http://localhost:5173')
        .split(',')
        .map(origin => origin.trim())
        .filter(origin => origin.length > 0)
        .map(origin => origin.replace(/\/$/, '')); 
    };

    const allowedOrigins = parseOrigins(process.env.FRONTEND_URL);
    console.log('Allowed CORS origins:', allowedOrigins);

    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", ...allowedOrigins, "https://amini-academy-api.onrender.com"],
          frameSrc: ["'self'", "https://www.youtube.com", "https://drive.google.com"],
          mediaSrc: ["'self'", "https:", "blob:"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }));

    const { generalLimiter } = await import('./middleware/rateLimiter.js');
    app.use('/api/', generalLimiter);

    app.use(cors({
      origin: (origin, callback) => {
        
        if (!origin) return callback(null, true);

        const normalizedOrigin = origin.replace(/\/$/, '');

        if (allowedOrigins.includes(normalizedOrigin)) {
          callback(null, true);
        } else {
          console.warn(`CORS blocked origin: ${origin}`);
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true, limit: '1mb' }));

    const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
    app.use('/uploads', (req, res, next) => {
      
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Range, Content-Type');
      res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
      res.header('Cross-Origin-Resource-Policy', 'cross-origin');

      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      next();
    }, express.static(uploadDir, {
      
      acceptRanges: true,
      
      maxAge: '1d',
      
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.mp4')) {
          res.setHeader('Content-Type', 'video/mp4');
        } else if (filePath.endsWith('.webm')) {
          res.setHeader('Content-Type', 'video/webm');
        } else if (filePath.endsWith('.ogg')) {
          res.setHeader('Content-Type', 'video/ogg');
        }
      }
    }));

    console.log('Loading routes...');
    const authRoutes = (await import('./routes/auth.js')).default;
    const courseRoutes = (await import('./routes/courses.js')).default;
    const progressRoutes = (await import('./routes/progress.js')).default;
    const pathRoutes = (await import('./routes/paths.js')).default;
    const adminRoutes = (await import('./routes/admin.js')).default;
    const uploadRoutes = (await import('./routes/upload.js')).default;

    app.use('/api/auth', authRoutes);
    app.use('/api/courses', courseRoutes);
    app.use('/api/progress', progressRoutes);
    app.use('/api/paths', pathRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/upload', uploadRoutes);

    console.log('Server ready');
  } catch (error) {
    console.error('Error loading app:', error);
  }
}

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
