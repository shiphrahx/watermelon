# CLAUDE.md

Guidance for working in the **Watermelon** repo.

## What this is

Single-page React app (Vite) hosted on GitHub Pages. It analyses a user's
calendar and messaging activity and produces a daily productivity / focus-time
report. Connects to Microsoft (calendar + Teams chat) and/or Slack; both
connections are optional and independent.

## Workflow conventions

- **Commit after every change**, not only at the end of a task. Keep commits
  small and incremental.
- **Do not add Claude authorship** to commits or PRs (no `Co-Authored-By:
  Claude`, no "Generated with Claude Code" footers).

## Commands

```bash
npm install        # install deps
npm run dev        # local dev server
npm run build      # production build to dist/
npm run preview    # preview the built bundle
npm run deploy     # build + push dist/ to the gh-pages branch
npm test           # run the Vitest suite once
npm run test:watch # watch mode
```

Slack proxy worker (separate from the React build):

```bash
cd cloudflare && npx wrangler deploy
```

## Architecture

- `src/auth/` — `microsoft.js` (MSAL.js, PKCE) and `slack.js` (OAuth 2.0 PKCE).
  Tokens live in `localStorage`. Microsoft uses popup login; Slack uses a
  redirect, completed on app load in `App.jsx`.
- `src/api/` — `graph.js` (Microsoft Graph, called directly from the browser)
  and `slack.js` (Slack, always routed through the Cloudflare Worker proxy
  because Slack's Web API has no CORS). These return **raw API-shaped** objects;
  filtering/parsing happens in normalization.
- `src/mock/` — deterministic mock data layer. `index.js` is the feature flag
  (`USE_MOCK`) and the single seam between mock and real fetchers — both return
  identical raw API shapes, so swapping requires no changes outside this layer.
  `generator.js` builds the last 10 working days deterministically (seeded PRNG,
  no `Math.random`); `calendar.js` / `teams.js` / `slack.js` slice it by range;
  `settings.js` holds default settings.
- `src/utils/normalize.js` — converts raw Graph/Slack shapes into the internal
  `{ start, end, isOnlineMeeting }` / `{ timestamp, source }` shapes. The one
  place that understands raw API shapes, keeping mock and real interchangeable.
- `src/analysis/classify.js` — classifies each 30-minute block of the working
  day into `meeting` / `focus` / `comms` / `possible-adhoc`. Core rules are in
  place; refinement points are marked with `TODO`.
- `src/analysis/report.js` — pure pipeline: raw data + range + working hours →
  per-day classified blocks (+ events/messages) + summary. React/network-free.
- `src/analysis/insights.js` — turns a report into dashboard metrics: focus
  rate, busiest/most-focused day, focus windows, top time consumers, focus by
  day, week-over-week trends, and plain-English summary sentences. Pure.
- Deep-insight analytics (all pure, one test file each):
  `analysis/overview.js` (day-quality labels, end-of-day overrun, per-day focus
  rate), `analysis/meetings.js` (back-to-back, fragmentation, recovery, longest
  block), `analysis/focus.js` (block-size distribution, AM/PM split, consistency,
  longest block), `analysis/messaging.js` (volume by hour, meeting multitasking,
  context switching, quietest hour, response pattern, Teams/Slack split).
- Dashboard is four tabs (`components/tabs/*`): Overview, Meetings, Focus,
  Messaging. Each tab computes its analytics from the shared report `days` via
  `useMemo`. The active tab is stored in the URL (`?tab=`) so it survives date
  changes and round-trips to the day view (`/day/:dateKey?tab=`).
- `src/utils/ranges.js` — week presets (this/last/last-2), week+day navigation,
  previous-week comparison, custom-range clamping (max 31 days).
- `src/utils/segments.js` — merges consecutive same-category blocks into the
  day-view timeline bands.
- `src/data/loadReport.js` — shared fetch+assemble used by both hooks.
- `src/hooks/useProductivityData.js` — `useDashboardData(range)` (current +
  previous week, insights, trends) and `useDayReport(dateKey)`. Mock mode
  bypasses connection gating.
- Categories are renamed for display in `classify.js` (`CATEGORY_LABELS`); the
  raw keys (`meeting`/`focus`/`comms`/`possible-adhoc`) must NEVER reach the UI.
  Palette is `--color-*` CSS vars mirroring `CATEGORY_COLORS`.
- Routes: `/` Dashboard (default), `/day/:dateKey` Day view, `/settings`.
  Default range is **this week** (Mon→today, or Mon→Fri on weekends).
- `src/components/` — `DateRangePicker`, `SummaryCards`, `Timeline`.
- `src/pages/` — `Dashboard`, `DayView`, `Settings`.
- `src/utils/` — `time.js` (block/date helpers) and `settings.js` (localStorage
  settings: working hours, Slack proxy URL).
- `src/config.js` — public identifiers from `VITE_*` env vars. No secrets.
- `cloudflare/worker.js` — Slack CORS proxy. Forwards `?path=<method>` to
  `https://slack.com/api/{path}` with the `token` header as Bearer auth. No
  stored secrets — the token is passed per request.

## Routing & deployment notes

- Uses **HashRouter** (`src/main.jsx`) because GitHub Pages cannot rewrite
  arbitrary paths to `index.html`. URLs look like `/watermelon/#/day`.
- `vite.config.js` sets `base: '/watermelon/'` to match the repo name. If the
  repo is renamed/forked, update `base` to match.
- The OAuth redirect URI is derived as `window.location.origin +
  import.meta.env.BASE_URL`, so it must be registered (with trailing slash) in
  both Azure AD and Slack. See `DEPLOY.md`.

## Conventions

- Plain CSS only (no UI framework); styles live in `src/index.css`.
- No secrets in the frontend — this is a browser-only PKCE app. All `VITE_*`
  values are public client identifiers.
- Keep both connections independent: the app must work with just Microsoft,
  just Slack, or both.
- **Write extensive tests for every piece of functionality** (happy path, edge
  cases, error handling). Tests live alongside source as `*.test.js` and run
  under Vitest. Mock data must stay **deterministic** — no `Math.random()` and
  no unseeded time.

## Further docs

- `README.md` — overview, quick start, project structure.
- `DEPLOY.md` — Azure AD registration, Slack app registration, Cloudflare
  Worker deployment, GitHub Pages setup, troubleshooting.
