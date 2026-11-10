import { createClient } from '@libsql/client';
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const appPath = fileURLToPath(new URL('../app.js', import.meta.url));
const source = readFileSync(appPath, 'utf8');
const catalogEnd = source.indexOf('\n];');
if (catalogEnd < 0) throw new Error('Event catalog unavailable');
const events = vm.runInNewContext(`${source.slice(0, catalogEnd + 3)}\nevents`, Object.create(null), { timeout: 1000 });
const eventById = id => events.find(event => event.id === id);
const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
let schemaPromise;

async function ready() {
  if (!schemaPromise) schemaPromise = (async () => {
    await db.execute('CREATE TABLE IF NOT EXISTS demo_accounts (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, salt TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)');
    await db.execute('CREATE TABLE IF NOT EXISTS demo_sessions (token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES demo_accounts(id), expires_at INTEGER NOT NULL)');
    await db.execute('CREATE TABLE IF NOT EXISTS demo_saved (account_id TEXT NOT NULL REFERENCES demo_accounts(id), event_id TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (account_id, event_id))');
    await db.execute('CREATE TABLE IF NOT EXISTS demo_registrations (id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES demo_accounts(id), event_id TEXT NOT NULL, occurrence_date TEXT NOT NULL, name TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, canceled_at TEXT)');
    await db.execute('CREATE UNIQUE INDEX IF NOT EXISTS demo_active_registration ON demo_registrations(account_id, event_id, occurrence_date) WHERE canceled_at IS NULL');
    await db.execute('CREATE TABLE IF NOT EXISTS demo_newsletter (email TEXT PRIMARY KEY, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)');
  })().catch(error => { schemaPromise = undefined; throw error; });
  await schemaPromise;
}

function send(res, status, payload, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
  res.end(JSON.stringify(payload));
}
const hash = token => createHash('sha256').update(token).digest('hex');
const publicAccount = row => ({ id: row.id, email: row.email });
const cookie = (token, age, req) => `gatherly_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${req.headers['x-forwarded-proto'] === 'https' || req.socket?.encrypted || process.env.VERCEL ? '; Secure' : ''}`;
function token(req) {
  const value = (req.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith('gatherly_session='))?.slice(17);
  return /^[A-Za-z0-9_-]{43}$/.test(value || '') ? value : null;
}
async function account(req) {
  const value = token(req);
  if (!value) return null;
  const rows = await db.execute({ sql: 'SELECT a.id, a.email FROM demo_sessions s JOIN demo_accounts a ON a.id = s.account_id WHERE s.token_hash = ? AND s.expires_at > ? LIMIT 1', args: [hash(value), Date.now()] });
  return rows.rows[0] || null;
}
function credentials(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).sort().join(',') !== 'email,password' || typeof input.email !== 'string' || typeof input.password !== 'string') return null;
  const email = input.email.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.endsWith('.test') && input.password.length >= 10 && input.password.length <= 128 ? { email, password: input.password } : null;
}
function inputOf(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) return null;
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  return JSON.stringify(body || {}).length <= 1024 ? body : null;
}
async function idsFor(accountId) {
  const result = await db.execute({ sql: 'SELECT event_id FROM demo_saved WHERE account_id = ? ORDER BY created_at, event_id', args: [accountId] });
  return result.rows.map(row => row.event_id);
}
async function remaining(event) {
  const result = await db.execute({ sql: 'SELECT COUNT(*) AS count FROM demo_registrations WHERE event_id = ? AND occurrence_date = ? AND canceled_at IS NULL', args: [event.id, event.dateISO] });
  return Math.max(0, event.capacity - Number(result.rows[0].count));
}
function sameOrigin(req) {
  if (!req.headers.origin) return true;
  try {
    const origin = new URL(req.headers.origin);
    return ['https:', 'http:'].includes(origin.protocol) && origin.host === req.headers.host && (origin.protocol === 'https:' || !process.env.VERCEL);
  } catch { return false; }
}
function method(req, res, allowed) {
  if (allowed.includes(req.method)) return true;
  send(res, 405, { error: 'Method not allowed' }, { Allow: allowed.join(', ') });
  return false;
}

export async function handle(req, res, route) {
  try {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !sameOrigin(req)) return send(res, 403, { error: 'Request origin is not allowed.' });
    await ready();
    const url = new URL(req.url, 'https://gatherly.example');
    let match;
    if (route === 'auth/me') {
      if (!method(req, res, ['GET'])) return;
      const current = await account(req);
      return send(res, 200, { account: current ? publicAccount(current) : null });
    }
    if (route === 'auth/signup' || route === 'auth/login') {
      if (!method(req, res, ['POST'])) return;
      let input;
      try { input = inputOf(req); } catch { return send(res, 400, { error: 'Invalid JSON request.' }); }
      const values = credentials(input);
      if (!values) return send(res, 400, { error: 'Use a fictional .test email and a made-up password of 10 to 128 characters.' });
      let current;
      if (route === 'auth/signup') {
        const salt = randomBytes(16).toString('hex');
        const id = randomUUID();
        try {
          await db.execute({ sql: 'INSERT INTO demo_accounts(id,email,salt,password_hash) VALUES(?,?,?,?)', args: [id, values.email, salt, scryptSync(values.password, salt, 64).toString('hex')] });
        } catch (error) {
          if (/UNIQUE|constraint/i.test(String(error))) return send(res, 409, { error: 'This demo account already exists.' });
          throw error;
        }
        current = { id, email: values.email };
      } else {
        const result = await db.execute({ sql: 'SELECT id,email,salt,password_hash FROM demo_accounts WHERE email = ?', args: [values.email] });
        const row = result.rows[0];
        if (!row) return send(res, 401, { error: 'Email or password did not match.' });
        const actual = scryptSync(values.password, row.salt, 64);
        const expected = Buffer.from(row.password_hash, 'hex');
        if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return send(res, 401, { error: 'Email or password did not match.' });
        current = row;
      }
      const session = randomBytes(32).toString('base64url');
      await db.execute({ sql: 'INSERT INTO demo_sessions(token_hash,account_id,expires_at) VALUES(?,?,?)', args: [hash(session), current.id, Date.now() + 86400000] });
      return send(res, route === 'auth/signup' ? 201 : 200, { account: publicAccount(current) }, { 'Set-Cookie': cookie(session, 86400, req) });
    }
    if (route === 'auth/logout') {
      if (!method(req, res, ['POST'])) return;
      const value = token(req);
      if (value) await db.execute({ sql: 'DELETE FROM demo_sessions WHERE token_hash = ?', args: [hash(value)] });
      return send(res, 200, { message: 'Signed out.' }, { 'Set-Cookie': cookie('', 0, req) });
    }
    if (route === 'me/saved') {
      if (!method(req, res, ['GET', 'PUT'])) return;
      const current = await account(req);
      if (!current) return send(res, 401, { error: 'Sign in to use your account shortlist.' });
      if (req.method === 'GET') return send(res, 200, { ids: await idsFor(current.id) });
      let input;
      try { input = inputOf(req); } catch { return send(res, 400, { error: 'Invalid JSON request.' }); }
      if (!input || Object.keys(input).join(',') !== 'ids' || !Array.isArray(input.ids) || input.ids.length > events.length || !input.ids.every(id => typeof id === 'string' && eventById(id))) return send(res, 400, { error: 'Saved events must be known event IDs.' });
      const unique = [...new Set(input.ids)];
      const statements = [{ sql: 'DELETE FROM demo_saved WHERE account_id = ?', args: [current.id] }, ...unique.map(id => ({ sql: 'INSERT INTO demo_saved(account_id,event_id) VALUES(?,?)', args: [current.id, id] }))];
      await db.batch(statements, 'write');
      return send(res, 200, { ids: await idsFor(current.id) });
    }
    if (route === 'me/registrations') {
      if (!method(req, res, ['GET'])) return;
      const current = await account(req);
      if (!current) return send(res, 401, { error: 'Sign in to view reservations.' });
      const result = await db.execute({ sql: 'SELECT id,event_id,occurrence_date FROM demo_registrations WHERE account_id = ? AND canceled_at IS NULL', args: [current.id] });
      return send(res, 200, { data: result.rows.map(row => ({ id: row.id, eventId: row.event_id, date: row.occurrence_date })) });
    }
    if (route === 'events/availability') {
      if (!method(req, res, ['GET'])) return;
      const event = eventById(req.query.id);
      if (!event) return send(res, 404, { error: 'Event not found.' });
      return send(res, 200, { eventId: event.id, date: event.dateISO, capacity: event.capacity, remaining: await remaining(event) });
    }
    if (route === 'registrations') {
      if (!method(req, res, ['POST'])) return;
      const current = await account(req);
      if (!current) return send(res, 401, { error: 'Sign in to reserve a spot.' });
      let input;
      try { input = inputOf(req); } catch { return send(res, 400, { error: 'Invalid JSON request.' }); }
      if (!input || Object.keys(input).sort().join(',') !== 'eventId,name' || typeof input.eventId !== 'string' || typeof input.name !== 'string') return send(res, 400, { error: 'Event and fictional name are required.' });
      const event = eventById(input.eventId);
      const name = input.name.trim();
      if (!event || name.length < 2 || name.length > 80 || /[<>\r\n]/.test(name)) return send(res, 400, { error: 'Choose an event and enter a fictional name.' });
      const id = randomUUID();
      try {
        const result = await db.execute({ sql: `INSERT INTO demo_registrations(id,account_id,event_id,occurrence_date,name)
          SELECT ?,?,?,?,? WHERE (SELECT COUNT(*) FROM demo_registrations WHERE event_id = ? AND occurrence_date = ? AND canceled_at IS NULL) < ?`,
          args: [id, current.id, event.id, event.dateISO, name, event.id, event.dateISO, event.capacity] });
        if (!result.rowsAffected) return send(res, 409, { error: 'This event is full.' });
      } catch (error) {
        if (/UNIQUE|constraint/i.test(String(error))) return send(res, 409, { error: 'You already have a spot for this event.' });
        throw error;
      }
      return send(res, 201, { registrationId: id, eventId: event.id, remaining: await remaining(event), message: 'Spot reserved in this demo. No payment or email was sent.' });
    }
    if (route === 'registrations/cancel') {
      if (!method(req, res, ['DELETE'])) return;
      const current = await account(req);
      if (!current) return send(res, 401, { error: 'Sign in to cancel a reservation.' });
      const result = await db.execute({ sql: 'UPDATE demo_registrations SET canceled_at = CURRENT_TIMESTAMP WHERE id = ? AND account_id = ? AND canceled_at IS NULL', args: [req.query.id, current.id] });
      if (!result.rowsAffected) return send(res, 404, { error: 'Reservation not found.' });
      return send(res, 200, { message: 'Reservation canceled in this demo.' });
    }
    if (route === 'newsletter') {
      if (!method(req, res, ['POST'])) return;
      let input;
      try { input = inputOf(req); } catch { return send(res, 400, { error: 'Invalid JSON request.' }); }
      if (!input || Object.keys(input).join(',') !== 'email' || typeof input.email !== 'string') return send(res, 400, { error: 'A single email field is required.' });
      const email = input.email.trim().toLowerCase();
      if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !email.endsWith('.test')) return send(res, 400, { error: 'Use a fictional .test email address for this demo.' });
      await db.execute({ sql: 'INSERT OR IGNORE INTO demo_newsletter(email) VALUES(?)', args: [email] });
      return send(res, 200, { message: 'Saved in this demo. No email will be sent.' });
    }
    if (route === 'events') {
      if (!method(req, res, ['GET'])) return;
      const queries = url.searchParams.getAll('q');
      if (queries.length !== 1 || !queries[0].trim() || queries[0].length > 80) return send(res, 400, { error: 'q must be one nonempty string of at most 80 characters' });
      const needle = queries[0].trim().toLocaleLowerCase('en');
      const data = events.filter(event => [event.title,event.location,event.category,event.description].some(value => value.toLocaleLowerCase('en').includes(needle))).map(({id,title,date,location,category,price}) => ({id,title,date,location,category,price}));
      return send(res, 200, { data });
    }
    return send(res, 404, { error: 'Not found.' });
  } catch (error) {
    console.error('Gatherly API error', error);
    return send(res, 503, { error: 'Demo service unavailable.' });
  }
}
