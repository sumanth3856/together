import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import ytSearch from 'yt-search';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { setupSocketHandlers } from './socketHandlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// A05: Security Misconfiguration - Set secure HTTP headers
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for simple static serving to avoid blocking assets, usually configured per app
  crossOriginEmbedderPolicy: false,
}));

// A05: Security Misconfiguration - Restrict CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://10.234.101.105:3000'];

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? allowedOrigins : '*',
  methods: ['GET', 'POST']
}));

// A04: Insecure Design - Limit JSON body size to prevent payload exhaustion
app.use(express.json({ limit: '10kb' }));

// A04: Insecure Design - Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all /api/ routes
app.use('/api/', apiLimiter);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let supabaseStatus = 'skipped';
  
  // Ping Supabase to keep it awake on the free tier
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
        headers: {
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
        }
      });
      supabaseStatus = response.ok ? 'awake' : 'error';
    } catch (err) {
      supabaseStatus = 'error';
    }
  }

  res.json({ 
    status: 'ok', 
    service: 'Together-Server', 
    supabase: supabaseStatus,
    timestamp: new Date().toISOString() 
  });
});

// YouTube Search endpoint
app.get('/api/youtube/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter "q"' });
    }
    const r = await ytSearch(query);
    // Return top 15 video results
    const videos = r.videos.slice(0, 15).map(v => ({
      youtubeId: v.videoId,
      title: v.title,
      thumbnail: v.thumbnail,
      duration: v.timestamp,
      author: v.author.name
    }));
    res.json({ results: videos });
  } catch (err) {
    console.error('YouTube search error:', err);
    res.status(500).json({ error: 'Failed to search YouTube' });
  }
});

// Serve static frontend build from client/dist if available
const clientDistPath = path.join(__dirname, '../../client/dist');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.redirect('http://localhost:3000');
  });
}

// Configure Socket.io for Vercel Serverless
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? allowedOrigins : '*',
    methods: ['GET', 'POST']
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

setupSocketHandlers(io);

const PORT = process.env.PORT || 4000;

if (!process.env.VERCEL) {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Together Server running on http://localhost:${PORT}`);
    
    // Keep-alive cron ping to prevent Render from sleeping
    const SERVER_URL = process.env.SERVER_URL || 'https://watch-together-f0xv.onrender.com';
    setInterval(() => {
      fetch(`${SERVER_URL}/api/health`)
        .then(res => console.log(`[Keep-Alive] Pinged ${SERVER_URL} - Status: ${res.status}`))
        .catch(err => console.error(`[Keep-Alive] Ping failed:`, err.message));
    }, 14 * 60 * 1000); // 14 minutes
  });
}

export default httpServer;
export { app, httpServer, io };
