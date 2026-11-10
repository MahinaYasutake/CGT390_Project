# Gatherly

Gatherly is a CGT 390 event discovery prototype with six fictional events. Visitors can browse, search, filter, open details, and save events. A fictional `.test` account can keep a shortlist and reserve or cancel a demo spot. The newsletter form also accepts only `.test` addresses. No email, payment, or real event booking occurs.

- Live site: https://cgt-390-project-seven.vercel.app/
- App folder: `event-discovery-app`

## Run locally

```sh
cd event-discovery-app
npm ci
npm run dev
```

Open http://localhost:4189/index.html. Local development uses `event-discovery-app/data/gatherly-demo.db`, which is ignored by Git. The hosted Vercel project uses its existing Turso connection through server-only `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` variables.

## Data and access

Guest saves stay in that browser. Signed-in saves, sessions, reservations, and demo newsletter signups use Turso. Passwords are stored as salted scrypt hashes; sessions use an HttpOnly, SameSite cookie. The API checks account ownership for saved lists and reservations, validates event IDs and request bodies, prevents duplicate active reservations, and enforces event capacity in the database. A local demo account is separate from a hosted demo account, so create a new fictional account on the live site.

The older anonymous `GET/POST/DELETE /api/saved` API remains available for compatibility with earlier lab work. The current interface uses the account endpoints when signed in and browser storage for guest saves.

## Verify

```sh
cd event-discovery-app
npm test
```

The tests cover the earlier saved-events API and the account, shortlist, reservation, capacity, cancellation, sign-in, and newsletter flow against a temporary local database.
