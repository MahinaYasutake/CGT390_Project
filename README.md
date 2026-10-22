# Gatherly

A CGT 390 event discovery prototype inspired by the Eventbrite workflow. Visitors browse six fictional events, search and filter the catalog, open details, and save or remove events from a shortlist.

- Live prototype: https://cgt-390-project-seven.vercel.app/
- Repository: https://github.com/MahinaYasutake/CGT390_Project
- Application folder: `event-discovery-app`

## Run locally

The backend branch uses a Node API and a local SQLite-compatible database:

```sh
cd event-discovery-app
npm install
npm run dev
```

Open http://localhost:4189/index.html. The local database is created at `event-discovery-app/data/gatherly.db` and is ignored by Git.

## Implemented lab changes

- Accessible event links, visible save labels, pressed states, focus indicators, and result announcements.
- Mobile navigation on a second row at widths up to 760px, 260px mobile detail artwork, and a sticky detail save row.
- Local analytics queue on all four pages; Google Analytics downloads only after the first pointer or keyboard interaction.
- Server-side event ID and request-body validation, duplicate-safe database writes, API failure feedback, and a missing-event state.
- Saving from Explore preserves search and filters without attaching duplicate filter listeners.
- Versioned application, analytics, and stylesheet URLs to distinguish this release from older assets.

## Data and architecture boundaries

The public catalog remains in a JavaScript array. The shortlist is stored in an SQLite-compatible `saved_events` table and accessed through `GET`, `POST`, and `DELETE /api/saved`. The API issues an anonymous, HttpOnly visitor cookie, derives the database owner from that cookie, validates IDs against its `events` table, and relies on a composite primary key to prevent duplicate saves. A foreign key protects the event relationship. On first load, the client attempts to move valid IDs from the earlier localStorage shortlist into the database, then removes the old key after successful writes. Saving does not reserve a place. This is not a signed-in account: a different browser gets a different shortlist, and losing the cookie loses access to the original list.

Local development uses an on-disk database. The Vercel Preview and Production environments have a connected Turso database with server-only `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` environment variables. The backend preview passed a hosted save, reload, Saved-page, and remove flow. The public live URL still runs the earlier browser-local version until the branch is promoted to production and retested there.

## Verification

The new API/database integration test requires Node.js and `npm install` in `event-discovery-app`:

```sh
cd event-discovery-app
npm test
```

Its sanitized request/response log is `output/lab9/backend-test-log.json`. For the backend branch's browser checks, run `NODE_PATH=/path/to/node_modules node scripts/test-backend-ui.cjs` with Playwright and Chromium available. The test covers save/reload, two tabs, a separate visitor, and migration of the previous localStorage list. It writes `backend-ui-tests.json` and a selected screenshot under `output/lab9`.

The older `test-lab9.cjs`, `test-mobile-analytics.cjs`, and `test-deployed.cjs` scripts document the browser-local implementation at commit `a20dda2`; they are not API tests and should be run against that historical version. The original baseline results are retained in `output/lab9/before-tests.json`.

Results from October 22, 2026: the new API/database integration test and 4/4 local backend UI checks passed. The connected preview passed a hosted save/reload/remove flow; see `output/lab9/preview-verification.json`. The earlier browser-local version passed 9/9 data checks and 11/11 mobile/analytics checks. Production API behavior, real account access, and a classmate's additional test remain pending.

The report can be regenerated with `python3 scripts/build_lab9_report.py` using the `reportlab` package. It uses installed Times New Roman font files from macOS's supplemental font directory by default; set `TIMES_NEW_ROMAN_DIR` for another font directory. Its double-spaced body is black 12-point type, with larger headings. The current PDF documents the backend branch, local tests, and connected preview; it identifies production and peer testing as pending.
