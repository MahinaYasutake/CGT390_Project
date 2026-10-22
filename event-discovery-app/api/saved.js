import { createClient } from '@libsql/client';
import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { events } from '../catalog.js';

const eventIds = events.map(event => event.id);
const cookieName = 'gatherly-visitor';
let database;
let schemaReady;

function db() {
  if (database) return database;
  const url = process.env.TURSO_DATABASE_URL || process.env.GATHERLY_DATABASE_URL;
  if (!url && process.env.VERCEL) throw new Error('Persistent database is not configured.');
  if (!url) mkdirSync(join(process.cwd(), 'data'), { recursive: true });
  database = createClient({
    url: url || `file:${join(process.cwd(), 'data', 'gatherly.db')}`,
    authToken: process.env.TURSO_AUTH_TOKEN
  });
  return database;
}

async function ready() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const client = db();
      await client.execute('PRAGMA foreign_keys = ON');
      await client.execute('CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY)');
      await client.execute('CREATE TABLE IF NOT EXISTS saved_events (visitor_id TEXT NOT NULL, event_id TEXT NOT NULL REFERENCES events(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (visitor_id, event_id))');
      for (const id of eventIds) {
        await client.execute({ sql: 'INSERT OR IGNORE INTO events (id) VALUES (?)', args: [id] });
      }
    })().catch(error => { schemaReady = undefined; throw error; });
  }
  await schemaReady;
  return db();
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function visitor(req, res) {
  const cookies = Object.fromEntries((req.headers.cookie || '').split(';').map(part => {
    const index = part.indexOf('=');
    return index < 0 ? ['', ''] : [part.slice(0, index).trim(), part.slice(index + 1).trim()];
  }));
  let id = cookies[cookieName];
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
    id = randomUUID();
    const secure = req.headers['x-forwarded-proto'] === 'https' || Boolean(req.socket?.encrypted);
    res.setHeader('Set-Cookie', `${cookieName}=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${secure ? '; Secure' : ''}`);
  }
  return createHash('sha256').update(id).digest('hex');
}

async function savedIds(client, visitorId) {
  const result = await client.execute({
    sql: 'SELECT event_id FROM saved_events WHERE visitor_id = ? ORDER BY created_at, event_id',
    args: [visitorId]
  });
  return result.rows.map(row => row.event_id);
}

async function body(req) {
  if (req.body !== undefined) {
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  }
  let data = '';
  for await (const chunk of req) {
    data += chunk;
    if (data.length > 1024) throw new Error('Body too large');
  }
  return JSON.parse(data);
}

export default async function handler(req, res) {
  if (!['GET', 'POST', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, DELETE');
    return send(res, 405, { error: 'METHOD_NOT_ALLOWED' });
  }
  try {
    const client = await ready();
    const visitorId = visitor(req, res);
    if (req.method === 'GET') return send(res, 200, { ids: await savedIds(client, visitorId) });

    let eventId;
    if (req.method === 'POST') {
      let input;
      try { input = await body(req); }
      catch { return send(res, 400, { error: 'INVALID_BODY' }); }
      if (!input || typeof input !== 'object' || Array.isArray(input) ||
          Object.keys(input).length !== 1 || typeof input.eventId !== 'string') {
        return send(res, 400, { error: 'INVALID_BODY' });
      }
      eventId = input.eventId;
    } else {
      eventId = new URL(req.url, 'http://localhost').searchParams.get('eventId');
      if (typeof eventId !== 'string') return send(res, 400, { error: 'EVENT_ID_REQUIRED' });
    }
    const exists = await client.execute({ sql: 'SELECT 1 FROM events WHERE id = ?', args: [eventId] });
    if (!exists.rows.length) return send(res, 404, { error: 'EVENT_NOT_FOUND' });

    if (req.method === 'POST') {
      const result = await client.execute({
        sql: 'INSERT OR IGNORE INTO saved_events (visitor_id, event_id) VALUES (?, ?)',
        args: [visitorId, eventId]
      });
      return send(res, result.rowsAffected ? 201 : 200, {
        eventId, saved: true, ids: await savedIds(client, visitorId)
      });
    }
    await client.execute({
      sql: 'DELETE FROM saved_events WHERE visitor_id = ? AND event_id = ?',
      args: [visitorId, eventId]
    });
    return send(res, 200, { eventId, saved: false, ids: await savedIds(client, visitorId) });
  } catch (error) {
    console.error('Saved events API failed:', error);
    return send(res, 503, { error: 'SAVE_SERVICE_UNAVAILABLE' });
  }
}
