# Gatherly

A CGT 390 event discovery prototype inspired by the Eventbrite workflow. Visitors browse six fictional events, search and filter the catalog, open details, and save or remove events from a browser-local shortlist.

- Live prototype: https://cgt-390-project-seven.vercel.app/
- Repository: https://github.com/MahinaYasutake/CGT390_Project
- Application folder: `event-discovery-app`

## Run locally

Serve `event-discovery-app` with any static HTTP server, for example:

```sh
python3 -m http.server 4173 --directory event-discovery-app --bind 127.0.0.1
```

Open http://127.0.0.1:4173/index.html. A file URL is not recommended for testing localStorage origin boundaries.

## Implemented lab changes

- Accessible event links, visible save labels, pressed states, focus indicators, and result announcements.
- Mobile navigation on a second row at widths up to 760px, 260px mobile detail artwork, and a sticky detail save row.
- Local analytics queue on all four pages; Google Analytics downloads only after the first pointer or keyboard interaction.
- Catalog ID and list type validation; safe handling of malformed browser storage; duplicate normalization; write-failure feedback; a missing-event state.
- Saving from Explore preserves search and filters without attaching duplicate filter listeners.
- Versioned application, analytics, and stylesheet URLs to distinguish this release from older assets.

## Data and architecture boundaries

The catalog is a public JavaScript array. The shortlist uses the `gatherly-saved-events` localStorage key for the current browser profile and origin. Saving does not reserve a place. There are no accounts, database writes, authentication, or save HTTP endpoints. Week 8's authenticated API, database uniqueness constraints, and transactional availability checks remain a production design proposal. Origin separation is not account authorization.

## Verification

The test scripts require Node.js and the Playwright package, plus a Playwright Chromium installation. Alternatively set `CHROME_PATH` to a Chrome executable. If Playwright lives outside this repository, set `NODE_PATH` to its containing node_modules folder.

```sh
node scripts/test-lab9.cjs after
node scripts/test-mobile-analytics.cjs
node scripts/test-deployed.cjs
```

The scripts start and close their own local static servers, use fresh isolated browser contexts, and block third-party network requests. Ports 4188, 4189, and 4191 must be available. `test-lab9.cjs` also accepts `LAB9_APP_DIR` and `LAB9_EVIDENCE_DIR` for testing another snapshot. The historical baseline is commit `51d8641`; its original results are retained in `output/lab9/before-tests.json`.

Results from October 22, 2026: 9/9 data checks and 11/11 mobile/analytics checks passed. Evidence, selected screenshots, and the Lab 9 PDF are in `output/lab9`. Third-party analytics delivery, production traffic performance, account isolation, and concurrent writes are not established by these checks. Vercel successfully deployed the merged changes. Three deployed assets matched local source, and live task flows passed at all three widths. A real classmate's additional test is still pending.
