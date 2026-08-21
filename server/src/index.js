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
import { pingRedis } from './redisClient.js';

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
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [
      // Production origins
      'https://beingus.vercel.app',
      // Local development origins
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://10.234.101.105:3000',
    ];

// Smart origin function: always allow in dev, check allowlist in production
const corsOriginFn = (origin, callback) => {
  // Allow non-browser requests (curl, server-to-server) and same-origin
  if (!origin) return callback(null, true);
  // Allow any Vercel preview deployment (*.vercel.app)
  if (origin.endsWith('.vercel.app')) return callback(null, true);
  if (allowedOrigins.includes(origin)) return callback(null, true);
  callback(new Error(`CORS: origin ${origin} not allowed`));
};

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? corsOriginFn : '*',
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

  const redisStatus = await pingRedis();

  res.json({ 
    status: 'ok', 
    service: 'Together-Server', 
    supabase: supabaseStatus,
    redis: redisStatus,
    timestamp: new Date().toISOString() 
  });
});

// Simple LRU cache for YouTube search results (5-minute TTL, 50-item cap)
const searchCache = new Map();
const SEARCH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const SEARCH_CACHE_MAX = 50;

function getCachedSearch(query) {
  const entry = searchCache.get(query);
  if (!entry) return null;
  if (Date.now() - entry.ts > SEARCH_CACHE_TTL) {
    searchCache.delete(query);
    return null;
  }
  return entry.results;
}

function setCachedSearch(query, results) {
  if (searchCache.size >= SEARCH_CACHE_MAX) {
    // Evict oldest entry
    searchCache.delete(searchCache.keys().next().value);
  }
  searchCache.set(query, { results, ts: Date.now() });
}

// YouTube Search endpoint
app.get('/api/youtube/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter "q"' });
    }

    // Serve from cache if available
    const cached = getCachedSearch(query);
    if (cached) {
      return res.json({ results: cached, cached: true });
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
    setCachedSearch(query, videos);
    res.json({ results: videos });
  } catch (err) {
    console.error('YouTube search error:', err);
    res.status(500).json({ error: 'Failed to search YouTube' });
  }
});

// oEmbed Provider & Discovery endpoint
app.get('/api/oembed', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing "url" parameter' });
  }

  // 1. Check known oEmbed endpoints first for fast direct resolution
  const knownProviders = [
    { pattern: /youtube\.com|youtu\.be/, endpoint: (u) => `https://www.youtube.com/oembed?url=${encodeURIComponent(u)}&format=json` },
    { pattern: /vimeo\.com/, endpoint: (u) => `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(u)}` },
    { pattern: /soundcloud\.com/, endpoint: (u) => `https://soundcloud.com/oembed?url=${encodeURIComponent(u)}&format=json` },
    { pattern: /spotify\.com/, endpoint: (u) => `https://open.spotify.com/oembed?url=${encodeURIComponent(u)}` },
    { pattern: /dailymotion\.com|dai\.ly/, endpoint: (u) => `https://www.dailymotion.com/services/oembed?url=${encodeURIComponent(u)}` },
    { pattern: /tiktok\.com/, endpoint: (u) => `https://www.tiktok.com/oembed?url=${encodeURIComponent(u)}` },
  ];

  for (const prov of knownProviders) {
    if (prov.pattern.test(targetUrl) && prov.endpoint) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const r = await fetch(prov.endpoint(targetUrl), { 
          signal: controller.signal, 
          headers: { 'User-Agent': 'Mozilla/5.0 Together-Watch/1.0' } 
        });
        clearTimeout(timeout);
        if (r.ok) {
          const data = await r.json();
          return res.json({
            title: data.title || '',
            author: data.author_name || '',
            provider: data.provider_name || '',
            thumbnail: data.thumbnail_url || '',
            html: data.html || null,
            type: data.type || 'video',
            url: targetUrl,
            oembed: true
          });
        }
      } catch (err) {
        // Fall through to discovery
      }
    }
  }

  // 2. Fallback: oEmbed Autodiscovery & OpenGraph HTML Scraper
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const r = await fetch(targetUrl, { 
      signal: controller.signal, 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      } 
    });
    clearTimeout(timeout);
    const html = await r.text();

    // Check for <link rel="alternate" type="application/json+oembed" href="...">
    const oembedLinkMatch = html.match(/<link[^>]+rel=["']alternate["'][^>]+type=["']application\/json\+oembed["'][^>]+href=["']([^"']+)["']/i) ||
                            html.match(/<link[^>]+type=["']application\/json\+oembed["'][^>]+href=["']([^"']+)["']/i);
    if (oembedLinkMatch && oembedLinkMatch[1]) {
      try {
        const oembedUrl = oembedLinkMatch[1];
        const oembedRes = await fetch(oembedUrl);
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          return res.json({
            title: oembedData.title || '',
            author: oembedData.author_name || '',
            provider: oembedData.provider_name || '',
            thumbnail: oembedData.thumbnail_url || '',
            html: oembedData.html || null,
            type: oembedData.type || 'video',
            url: targetUrl,
            oembed: true
          });
        }
      } catch {}
    }

    // Fallback: Parse OpenGraph metadata & <title>
    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1];
    const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
    const ogSite = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i)?.[1];
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];

    return res.json({
      title: (ogTitle || titleMatch || targetUrl.split('/').pop() || 'External Media').trim(),
      thumbnail: ogImage || '',
      provider: ogSite || '',
      url: targetUrl,
      oembed: false
    });
  } catch (err) {
    const fallbackTitle = targetUrl.split('/').pop()?.split('?')[0] || 'External Media';
    return res.json({
      title: fallbackTitle,
      thumbnail: '',
      provider: '',
      url: targetUrl,
      fallback: true
    });
  }
});

// Backward-compatible metadata endpoint
app.get('/api/metadata', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing "url" parameter' });
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(`http://localhost:${PORT || 4000}/api/oembed?url=${encodeURIComponent(targetUrl)}`, { signal: controller.signal });
    clearTimeout(timeout);
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
  } catch {}
  res.json({
    title: targetUrl.split('/').pop()?.split('?')[0] || 'External Media',
    url: targetUrl
  });
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
    origin: process.env.NODE_ENV === 'production' ? corsOriginFn : '*',
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
