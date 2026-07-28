import { app, io } from '../server/src/index.js';

export default function handler(req, res) {
  // Ensure req.socket exists for Engine.io in Vercel Serverless environment
  if (!req.socket) {
    req.socket = {
      remoteAddress: (req.headers && req.headers['x-forwarded-for']) || '127.0.0.1',
      encrypted: true,
      on: () => {},
      once: () => {},
      emit: () => {},
      removeListener: () => {}
    };
  }

  // Set CORS headers for Vercel Serverless Functions
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.url && req.url.includes('/socket.io')) {
    try {
      io.engine.handleRequest(req, res);
    } catch (err) {
      console.error('Vercel Socket polling error caught:', err);
      if (!res.headersSent) {
        res.status(200).end();
      }
    }
  } else {
    app(req, res);
  }
}
