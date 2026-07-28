import { app, io } from '../server/src/index.js';

export default function handler(req, res) {
  if (req.url && req.url.includes('/socket.io')) {
    io.engine.handleRequest(req, res);
  } else {
    app(req, res);
  }
}
