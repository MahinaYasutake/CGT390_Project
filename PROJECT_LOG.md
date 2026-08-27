# CGT 390 AI-Assisted Working Baseline Log

This file is the running record for the case-study baseline. It is intentionally kept in the repository so the planning, prompting, implementation, testing, and deployment evidence stays together.

## Project status

- Current phase: 2 — baseline implementation and local testing
- Reference site: [Eventbrite](https://www.eventbrite.com/)
- Application status: Not started
- GitHub repository: TBD
- Vercel deployment: TBD

## Professor's required workflow

- [ ] 1. Confirm the case-study website/application.
- [ ] 2. Select 3–5 connected pages and at least one working feature; explain the foundation.
- [ ] 3. Provide full context to AI, receive a plan, review/refine it, and approve implementation.
- [ ] 4. Implement the first approved part: pages, navigation, and fictional sample content.
- [ ] 5. Add and test the selected feature locally.
- [ ] 6. Review changed files; commit and push to GitHub; deploy to Vercel.
- [ ] 7. Verify the deployed site loads and one primary task works.
- [ ] 8. Record missing, simulated, broken, or uncertain items.

## Proposed case-study brief

### Reference site

Eventbrite is the reference site for an event-discovery and event-registration experience. The implementation will be inspired by the type of workflow, not copied from Eventbrite. It will use a new name, fictional events, original copy, and original styling.

### Intended user

People looking for local or online activities who want to discover an event, inspect its details, and save an event for later.

### Proposed baseline scope

1. **Home / Discover** — featured fictional events, category shortcuts, and navigation.
2. **Explore Events** — a searchable/filterable event list.
3. **Event Details** — the selected event's date, location, description, organizer, and save action.
4. **Saved Events** — events saved by the current browser session.

### Proposed working feature

Client-side event search and category filtering, plus a save/unsave action backed by browser local storage. This is a manageable primary task that connects the list, detail, and saved-event pages without requiring real accounts, payments, or an external event database.

### Why this is a useful foundation

These pages establish a complete discovery journey: find an event, narrow the choices, read details, and keep a shortlist. That structure can support later labs focused on usability, accessibility, content quality, SEO/GEO, security, and trustworthiness.

### Deliberate boundaries for this lab

- No real Eventbrite branding, logos, content, accounts, payments, or event inventory.
- No real registration or ticket purchase flow.
- No production authentication or server-side persistence in the first baseline.
- Responsive behavior and basic accessibility will be checked, but visual polish is secondary to a connected working flow.

## AI-use evidence

### Initial application prompt

> I am completing a CGT 390 lab. Build a rough working baseline for an original event-discovery web application inspired by the general workflow of Eventbrite (https://www.eventbrite.com/), without copying its branding, content, layout, or assets. The intended users are people looking for local or online activities. Create 4 connected pages: Home/Discover, Explore Events, Event Details, and Saved Events. Use fictional event data and original styling. The main working feature should be client-side event search and category filtering, with save/unsave using browser local storage so the saved list persists during the browser session. Keep the scope manageable and explain your proposed technical plan before implementing. Prioritize working navigation and a testable primary task over visual polish. Do not add real accounts, payments, or third-party data.

### AI-proposed plan

1. Create a lightweight static web app inside `event-discovery-app` so the baseline stays easy to run and inspect.
2. Define one shared fictional event dataset and render it into the home, explore, detail, and saved views.
3. Build responsive original styling with a distinct Gatherly identity rather than Eventbrite branding or copied content.
4. Add client-side search and category filters on Explore.
5. Add save/unsave controls using browser local storage and expose saved items on Saved Events.
6. Verify navigation, filtering, detail links, saving, newsletter feedback, and empty states locally before deployment.

### Plan review and refinement

Approved on 2026-08-27. Refinements: use a static implementation with no external data or authentication, keep the event inventory fictional, and treat browser local storage as the working baseline for saving.

### Implementation prompt

> Implement the approved Gatherly baseline inside `event-discovery-app`. Create four connected pages—Home/Discover, Explore Events, Event Details, and Saved Events—with fictional events and original styling. Use one shared JavaScript event dataset. Add client-side search and category filtering on Explore. Add save/unsave controls using browser local storage and show the saved count in navigation. Keep the interface responsive and include basic semantic labels, visible focus-friendly controls, empty states, and a newsletter form with local success feedback. Do not use Eventbrite branding, copied content, external APIs, accounts, or payments.

## Work log

### 2026-08-27 — Project setup and planning log

- Confirmed the selected reference site: Eventbrite.
- Inspected the repository; it was empty except for `.git`.
- Created this roadmap/evidence log before implementation.
- Approved the proposed pages and feature.
- Created the Gatherly static baseline in `event-discovery-app`.
- Started a local static server on port 4173 for verification.
- Corrected the browser test selector to target the Creative filter button explicitly because the word also appears as an event label.
- Began a reversible glassmorphism visual experiment by adding `glassmorphism-experiment.css`; removing its stylesheet link restores the previous look without changing application logic.
- Reverted the glassmorphism experiment on request because it reduced the desired warmth; restored the original stylesheet links on all pages.
- Created the first local Git commit `26a1d9c` (`Create Gatherly working baseline`) using the student's supplied Git identity.
- GitHub connection is waiting for browser sign-in before repository creation/push.

## Test evidence

### Local testing

Tested 2026-08-27 using the local server at `http://localhost:4173/`:

- Home page loaded and displayed the fictional featured events, navigation, and newsletter form: passed.
- Explore initially displayed 6 events: passed.
- Searching for `clay` reduced results to 1 event and showed `1 event`: passed.
- Selecting the Creative category kept the matching event visible: passed.
- Opening the Clay Club event navigated to Event Details and displayed the correct title: passed.
- Saving the event changed the action to `♥ Saved`; opening Saved Events displayed the event: passed.
- Newsletter form accepted a test email and displayed `You’re on the list—see you next week.` locally: passed.
- Browser console error check returned 0 errors: passed.
- Remaining local verification: responsive viewport check and a final fresh-browser saved-state check.

### Deployed testing

Pending GitHub/Vercel deployment.

## Missing, simulated, broken, or uncertain

- Current application is not implemented yet.
- Save behavior is planned as browser-local simulation, not a real account-backed feature.
- Event data is planned as fictional sample content.
- GitHub and Vercel URLs are not available yet.

## Reflection draft

Pending completion after implementation and testing. The final reflection will be 3–5 sentences covering what AI handled successfully, what required human direction or correction, and one remaining limitation.
