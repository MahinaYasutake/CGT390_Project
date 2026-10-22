import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import savedHandler from './api/saved.js';

const root = dirname(fileURLToPath(import.meta.url));
const files = new Set([
  'index.html', 'explore.html', 'event.html', 'saved.html',
  'app.js', 'catalog.js', 'analytics.js', 'styles.css', 'glassmorphism-experiment.css'
]);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const port = Number(process.env.PORT || 4189);

const server = createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname.slice(1) || 'index.html';
  if (path === 'api/saved') return savedHandler(req, res);
  if (!files.has(path)) { res.writeHead(404); return res.end('Not found'); }
  try {
    const data = await readFile(join(root, path));
    res.writeHead(200, { 'Content-Type': `${types[path.slice(path.lastIndexOf('.'))]}; charset=utf-8` });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
});

server.listen(port, () => console.log(`Gatherly local server: http://localhost:${port}`));
