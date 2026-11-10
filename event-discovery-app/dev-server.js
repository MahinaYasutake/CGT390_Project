import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import savedHandler from './api/saved.js';

const root = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(root, 'data'), { recursive:true });
process.env.TURSO_DATABASE_URL ||= `file:${join(root, 'data', 'gatherly-demo.db')}`;
const { handle } = await import('./api/_core.js');
const files = new Set(['index.html','explore.html','event.html','saved.html','account.html','app.js','catalog.js','analytics.js','styles.css','glassmorphism-experiment.css']);
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css' };
const port = Number(process.env.PORT || 4189);

function routeFor(path) {
  const routes = new Set(['auth/me','auth/signup','auth/login','auth/logout','me/saved','me/registrations','registrations','newsletter','events']);
  const route = path.slice(4);
  if (routes.has(route)) return { route };
  const availability = route.match(/^events\/([a-z0-9-]+)\/availability$/);
  if (availability) return { route:'events/availability', id:availability[1] };
  const cancel = route.match(/^registrations\/([a-f0-9-]{36})$/);
  if (cancel) return { route:'registrations/cancel', id:cancel[1] };
  return null;
}

const server = createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname.slice(1) || 'index.html';
  if (path === 'api/saved') return savedHandler(req, res);
  if (path.startsWith('api/')) {
    const target = routeFor(path);
    if (!target) { res.writeHead(404); return res.end('Not found'); }
    req.query = { id:target.id };
    if (['POST','PUT','PATCH'].includes(req.method)) {
      let body = '';
      for await (const part of req) {
        body += part;
        if (body.length > 1024) { res.writeHead(413); return res.end('Request too large'); }
      }
      req.body = body;
    }
    return handle(req, res, target.route);
  }
  if (!files.has(path)) { res.writeHead(404); return res.end('Not found'); }
  try {
    const data = await readFile(join(root, path));
    res.writeHead(200, { 'Content-Type': `${types[path.slice(path.lastIndexOf('.'))]}; charset=utf-8` });
    res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(port, () => console.log(`Gatherly local server: http://localhost:${port}`));
