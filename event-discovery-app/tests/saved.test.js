import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient } from '@libsql/client';

const directory = await mkdtemp(join(tmpdir(), 'gatherly-api-'));
const url = `file:${join(directory, 'test.db')}`;
process.env.GATHERLY_DATABASE_URL = url;
const { default: handler } = await import('../api/saved.js');
const server = createServer(handler);
await new Promise(resolve => server.listen(0, resolve));
const base = `http://127.0.0.1:${server.address().port}`;

async function request(method, cookie, eventId, extra) {
  const path = method === 'DELETE' ? `/api/saved?eventId=${encodeURIComponent(eventId)}` : '/api/saved';
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {})
    },
    body: method === 'POST' ? JSON.stringify(extra ?? { eventId }) : undefined
  });
  return {
    status: response.status,
    cookie: response.headers.get('set-cookie')?.split(';')[0],
    body: await response.json()
  };
}

test('server-backed saved events enforce the contract and visitor boundary', async () => {
  try {
    const first = await request('GET');
    assert.equal(first.status, 200);
    assert.deepEqual(first.body, { ids: [] });
    assert.match(first.cookie, /^gatherly-visitor=/);

    const saved = await request('POST', first.cookie, 'clay-club');
    assert.equal(saved.status, 201);
    assert.deepEqual(saved.body.ids, ['clay-club']);
    assert.equal((await request('GET', first.cookie)).body.ids.length, 1);

    const duplicate = await request('POST', first.cookie, 'clay-club');
    assert.equal(duplicate.status, 200);
    assert.deepEqual(duplicate.body.ids, ['clay-club']);

    const invalid = await request('POST', first.cookie, 'not-real');
    assert.equal(invalid.status, 404);
    assert.equal(invalid.body.error, 'EVENT_NOT_FOUND');
    assert.equal((await request('GET', first.cookie)).body.ids.length, 1);

    const wrongType = await request('POST', first.cookie, null, { eventId: 42 });
    assert.equal(wrongType.status, 400);
    const forgedIdentity = await request('POST', first.cookie, null, { eventId: 'poster-lab', visitorId: 'someone-else' });
    assert.equal(forgedIdentity.status, 400);

    const other = await request('GET');
    assert.deepEqual(other.body.ids, []);
    assert.notEqual(other.cookie, first.cookie);
    assert.deepEqual((await request('POST', other.cookie, 'field-notes')).body.ids, ['field-notes']);
    assert.deepEqual((await request('GET', first.cookie)).body.ids, ['clay-club']);
    const crossDelete = await request('DELETE', other.cookie, 'clay-club');
    assert.deepEqual(crossDelete.body.ids, ['field-notes']);
    const firstAfterCrossDelete = await request('GET', first.cookie);
    assert.deepEqual(firstAfterCrossDelete.body.ids, ['clay-club']);

    const removed = await request('DELETE', first.cookie, 'clay-club');
    assert.equal(removed.status, 200);
    assert.deepEqual(removed.body.ids, []);
    assert.deepEqual((await request('GET', first.cookie)).body.ids, []);

    const database = createClient({ url });
    const rows = await database.execute('SELECT visitor_id, event_id FROM saved_events');
    assert.equal(rows.rows.length, 1);
    assert.equal(rows.rows[0].event_id, 'field-notes');
    assert.notEqual(rows.rows[0].visitor_id, other.cookie.split('=')[1]);
    await database.execute('PRAGMA foreign_keys = ON');
    await assert.rejects(database.execute({
      sql: 'INSERT INTO saved_events (visitor_id, event_id) VALUES (?, ?)',
      args: ['test-visitor', 'not-real']
    }));
    database.close();

    const evidence = [
      { test: 'Valid save and persistence', input: 'POST {"eventId":"clay-club"}; GET', identity: 'Visitor A', expected: '201; one saved ID after read', actual: { status: saved.status, response: saved.body } },
      { test: 'Duplicate save', input: 'POST {"eventId":"clay-club"} again', identity: 'Visitor A', expected: '200; still one row', actual: { status: duplicate.status, response: duplicate.body } },
      { test: 'Unknown event', input: 'POST {"eventId":"not-real"}', identity: 'Visitor A', expected: '404; list unchanged', actual: { status: invalid.status, response: invalid.body } },
      { test: 'Wrong type', input: 'POST {"eventId":42}', identity: 'Visitor A', expected: '400; list unchanged', actual: { status: wrongType.status, response: wrongType.body } },
      { test: 'Forged identity field', input: 'POST with extra visitorId field', identity: 'Visitor A', expected: '400; identity must come from cookie', actual: { status: forgedIdentity.status, response: forgedIdentity.body } },
      { test: 'Visitor isolation', input: 'GET as B; save field-notes; DELETE clay-club as B; GET as A', identity: 'Visitors A and B', expected: 'B cannot remove A’s row', actual: { otherInitial: other.body, crossDelete: crossDelete.body, firstAfter: firstAfterCrossDelete.body } },
      { test: 'Remove and persistence', input: 'DELETE clay-club; GET', identity: 'Visitor A', expected: '200; list empty after read', actual: { status: removed.status, response: removed.body } },
      { test: 'Database constraints', input: 'Direct insert with nonexistent event ID', identity: 'Test database client', expected: 'Foreign-key rejection; database retains only B’s row', actual: { rejected: true, storedRows: rows.rows.length } }
    ];
    await writeFile(join(process.cwd(), '..', 'output', 'lab9', 'backend-test-log.json'), JSON.stringify(evidence, null, 2) + '\n');
  } finally {
    server.close();
    await rm(directory, { recursive: true, force: true });
  }
});
