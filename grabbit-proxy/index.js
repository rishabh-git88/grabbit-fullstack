const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({ ws: true });

const BACKEND = 'http://localhost:3001';
const EXPO    = 'http://localhost:5001';

const server = http.createServer((req, res) => {
  const isApi    = req.url.startsWith('/api');
  const isSocket = req.url.startsWith('/socket.io');
  const target   = (isApi || isSocket) ? BACKEND : EXPO;

  proxy.web(req, res, { target }, (err) => {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Proxy error: ' + err.message);
  });
});

server.on('upgrade', (req, socket, head) => {
  const isSocket = req.url.startsWith('/socket.io');
  const target   = isSocket ? BACKEND : EXPO;
  proxy.ws(req, socket, head, { target });
});

server.listen(5000, '0.0.0.0', () => {
  console.log('[Grabbit Proxy] Running on :5000');
  console.log('  /api, /socket.io  →  backend :3001');
  console.log('  all else          →  expo    :5001');
});
