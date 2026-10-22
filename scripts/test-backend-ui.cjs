const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const { mkdtempSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const app = path.join(root, 'event-discovery-app');
const out = path.join(root, 'output/lab9');
const temp = mkdtempSync(path.join(tmpdir(), 'gatherly-ui-'));
const port = 4198;
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['dev-server.js'], {
  cwd: app,
  env: { ...process.env, PORT: String(port), GATHERLY_DATABASE_URL: `file:${path.join(temp, 'test.db')}` },
  stdio: 'ignore'
});

async function ready() {
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(base + '/api/saved')).ok) return; }
    catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Local Gatherly server did not start.');
}

(async () => {
  let browser;
  const evidence = [];
  try {
    await ready();
    browser = await chromium.launch({
      executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.goto(base + '/explore.html');
    await page.locator('[data-search]').fill('clay');
    await page.locator('[data-save="clay-club"]').click();
    await assert.doesNotReject(page.getByText('Event saved for this browser.').waitFor());
    assert.equal(await page.locator('[data-search]').inputValue(), 'clay');
    await page.reload();
    await page.getByRole('link', { name: 'Saved 1' }).waitFor();
    evidence.push({ test: 'Save, reload, and retain search', expected: 'Saved 1 and search clay', actual: { savedCount: 1, search: 'clay before reload' }, pass: true });

    const secondTab = await context.newPage();
    secondTab.on('pageerror', error => errors.push(error.message));
    await secondTab.goto(base + '/event.html?id=poster-lab');
    await secondTab.locator('[data-save="poster-lab"]').click();
    await secondTab.getByRole('link', { name: 'Saved 2' }).waitFor();
    await page.goto(base + '/saved.html');
    await page.locator('.event-card').nth(1).waitFor();
    assert.equal(await page.locator('.event-card').count(), 2);
    await page.screenshot({ path: path.join(out, 'backend-saved-two-tabs.png'), fullPage: true });
    evidence.push({ test: 'Two tabs share server-backed list', expected: 'Two saved cards after reload', actual: { cards: 2 }, pass: true });

    const otherContext = await browser.newContext();
    const otherPage = await otherContext.newPage();
    otherPage.on('pageerror', error => errors.push(error.message));
    await otherPage.goto(base + '/saved.html');
    await otherPage.getByRole('link', { name: 'Saved 0' }).waitFor();
    assert.equal(await otherPage.locator('.event-card').count(), 0);
    evidence.push({ test: 'Separate visitor', expected: 'No saved cards', actual: { cards: 0 }, pass: true });
    await otherContext.close();

    await page.evaluate(() => localStorage.setItem('gatherly-saved-events', '["field-notes"]'));
    await page.reload();
    await page.getByRole('link', { name: 'Saved 3' }).waitFor();
    assert.equal(await page.locator('.event-card').count(), 3);
    assert.equal(await page.evaluate(() => localStorage.getItem('gatherly-saved-events')), null);
    evidence.push({ test: 'One-time localStorage migration', expected: 'Third DB row and old key removed', actual: { cards: 3, oldKey: null }, pass: true });

    assert.deepEqual(errors, []);
    writeFileSync(path.join(out, 'backend-ui-tests.json'), JSON.stringify({ date: '2026-10-22', evidence, pageErrors: errors }, null, 2) + '\n');
    console.log(`${evidence.length}/${evidence.length} backend UI checks passed`);
    await context.close();
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
    rmSync(temp, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
