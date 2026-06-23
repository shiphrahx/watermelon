# 🍉 Watermelon

A single-page React app that analyses your **calendar** and **messaging activity**
to generate a daily **productivity and focus-time report**.

Watermelon connects to Microsoft (calendar + Teams chat) and/or Slack, then
slices your working day into 30-minute blocks and classifies each one as:

| Category         | Meaning                                                              |
| ---------------- | -------------------------------------------------------------------- |
| **Meeting**      | Covered by a calendar event you accepted                             |
| **Focus**        | No event **and** no messages for ≥ 20 consecutive minutes            |
| **Comms**        | No event but messages are present                                    |
| **Possible ad-hoc** | No event; messaging stops abruptly for 30+ min then resumes       |

Both connections are **optional and independent** — the app works with just
Microsoft connected, just Slack connected, or both.

---

## Features

- **Dashboard** — summary cards with total time per category over a date range
- **Day view** — colour-coded 30-minute timeline, one row per day
- **Settings** — connect/disconnect accounts, set working hours, set the Slack proxy URL

Tokens are stored in `localStorage`. All API calls are made from the browser,
except Slack, which is proxied through a Cloudflare Worker (Slack's API has no
CORS support).

---

## Tech stack

- React + Vite
- Plain CSS (no UI framework)
- `react-router-dom` (HashRouter, for GitHub Pages)
- `@azure/msal-browser` for Microsoft auth (PKCE)
- Slack OAuth 2.0 with PKCE
- Cloudflare Worker proxy for the Slack API
- Deployed to GitHub Pages via `gh-pages`

---

## Quick start (local development)

```bash
npm install
cp .env.example .env     # fill in your client IDs / proxy URL
npm run dev
```

Open the printed local URL. Go to **Settings** to connect Microsoft and/or Slack.

### Environment variables

See `.env.example`. All are **public** identifiers (this is a browser-only PKCE
app — there are no secrets in the frontend):

| Var | Description |
| --- | --- |
| `VITE_MS_CLIENT_ID`   | Azure AD application (client) ID |
| `VITE_MS_AUTHORITY`   | `https://login.microsoftonline.com/common` (or your tenant) |
| `VITE_SLACK_CLIENT_ID`| Slack app client ID |
| `VITE_SLACK_PROXY_URL`| Default Cloudflare Worker URL (also editable in Settings) |

---

## Setup & deployment

Full step-by-step instructions — Azure AD registration, Slack app registration,
Cloudflare Worker deployment, and GitHub Pages setup — are in **[DEPLOY.md](./DEPLOY.md)**.

Short version:

```bash
# 1. Deploy the Slack proxy worker
cd cloudflare && npx wrangler deploy

# 2. Build & publish to the gh-pages branch
npm run deploy
```

`vite.config.js` sets `base: '/watermelon/'` so asset paths and routing resolve
at `https://<your-username>.github.io/watermelon/`. If you fork under a
different repo name, update `base` to match.

---

## Project structure

```
watermelon/
├── cloudflare/
│   ├── worker.js          # Slack API CORS proxy
│   └── wrangler.toml
├── src/
│   ├── auth/              # microsoft.js (MSAL), slack.js (OAuth PKCE)
│   ├── api/               # graph.js, slack.js
│   ├── analysis/          # classify.js (block classification)
│   ├── components/        # DateRangePicker, Timeline, SummaryCards
│   ├── pages/             # Dashboard, DayView, Settings
│   ├── hooks/             # useProductivityData.js
│   ├── utils/             # time.js, settings.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── DEPLOY.md
├── vite.config.js
└── package.json
```

---

## Notes on the analysis logic

The classification in `src/analysis/classify.js` implements the core rules and
is intentionally a **starting point** — see the `TODO` comments for where to
refine the "possible ad-hoc" detection (cross-block silence, per-source
weighting, message-volume thresholds, confidence scoring).
