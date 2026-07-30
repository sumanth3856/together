import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { setupSocketHandlers } from './socketHandlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}));

app.use(express.json());

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
    origin: '*',
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
