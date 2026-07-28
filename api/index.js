import { httpServer, app } from '../server/src/index.js';

export default function handler(req, res) {
  if (req.url && req.url.startsWith('/socket.io')) {
    httpServer.emit('request', req, res);
  } else {
    app(req, res);
  }
}
