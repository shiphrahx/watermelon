# Deploying Watermelon

This guide covers everything needed to run Watermelon in production:

1. [Microsoft Azure AD app registration](#1-microsoft-azure-ad-app-registration)
2. [Slack app registration](#2-slack-app-registration)
3. [Cloudflare Worker (Slack proxy) deployment](#3-cloudflare-worker-deployment)
4. [Environment / config](#4-environment--config)
5. [GitHub Pages deployment](#5-github-pages-deployment)

Throughout, replace `your-username` with your GitHub username. The app is
served at:

```
https://your-username.github.io/watermelon/
```

This URL (with the trailing slash) is the **redirect URI** used by both
Microsoft and Slack, because the app derives it from
`window.location.origin + import.meta.env.BASE_URL`.

---

## 1. Microsoft Azure AD app registration

1. Go to the [Azure Portal](https://portal.azure.com) → **Microsoft Entra ID**
   → **App registrations** → **New registration**.
2. **Name**: `Watermelon` (anything).
3. **Supported account types**: choose **Accounts in any organizational
   directory and personal Microsoft accounts** for the `common` authority, or a
   single tenant if you prefer.
4. **Redirect URI**: select platform **Single-page application (SPA)** and enter:
   ```
   https://your-username.github.io/watermelon/
   ```
   For local development also add:
   ```
   http://localhost:5173/watermelon/
   ```
5. Click **Register**.
6. On the **Overview** page, copy the **Application (client) ID** →
   `VITE_MS_CLIENT_ID`.
7. **API permissions** → **Add a permission** → **Microsoft Graph** →
   **Delegated permissions**, add:
   - `Calendars.Read`
   - `Chat.Read`
   - `User.Read`

   Grant admin consent if your tenant requires it.

> The app uses the **PKCE auth-code flow** via MSAL.js — no client secret is
> needed (and none should be added to a browser app).

---

## 2. Slack app registration

1. Go to <https://api.slack.com/apps> → **Create New App** → **From scratch**.
2. Name it `Watermelon`, pick your workspace.
3. **OAuth & Permissions**:
   - Under **Redirect URLs**, add:
     ```
     https://your-username.github.io/watermelon/
     ```
     and for local dev:
     ```
     http://localhost:5173/watermelon/
     ```
   - Under **User Token Scopes** (these are user-level history scopes), add:
     - `channels:history`
     - `im:history`
     - `calls:read`
4. From **Basic Information**, copy the **Client ID** → `VITE_SLACK_CLIENT_ID`.
   (The client secret is **not** used by the browser; token exchange is done
   with PKCE through the proxy without a secret.)

> Slack's Web API does not send CORS headers, so all Slack calls — including the
> OAuth token exchange — are routed through the Cloudflare Worker proxy.

---

## 3. Cloudflare Worker deployment

The worker forwards browser requests to `https://slack.com/api/{path}` and adds
CORS headers for your GitHub Pages origin. It stores **no secrets** — the user's
token is passed per request.

1. Edit `cloudflare/worker.js` and set:
   ```js
   const ALLOWED_ORIGIN = 'https://your-username.github.io'
   ```
   (origin only — no path, no trailing slash).
2. Install Wrangler and deploy:
   ```bash
   cd cloudflare
   npx wrangler login
   npx wrangler deploy
   ```
3. Wrangler prints the deployed URL, e.g.:
   ```
   https://watermelon-slack-proxy.your-name.workers.dev
   ```
   Use this as `VITE_SLACK_PROXY_URL` and/or paste it into the app's **Settings**
   page.

### Worker request contract

- `?path=<slack.method>` — required, the Slack method to call.
- `token` header — the user's Slack token, forwarded as `Bearer` auth.
- Other query params and POST bodies are forwarded to Slack unchanged.

---

## 4. Environment / config

Copy `.env.example` to `.env` and fill in:

```ini
VITE_MS_CLIENT_ID=<application-client-id>
VITE_MS_AUTHORITY=https://login.microsoftonline.com/common
VITE_SLACK_CLIENT_ID=<slack-client-id>
VITE_SLACK_PROXY_URL=https://watermelon-slack-proxy.your-name.workers.dev
```

These are read at **build time** by Vite, so set them before running
`npm run build` / `npm run deploy`. The Slack proxy URL can also be changed at
runtime on the **Settings** page (stored in `localStorage`).

---

## 5. GitHub Pages deployment

1. Make sure `base` in `vite.config.js` matches your repo name (default
   `/watermelon/`).
2. Build and publish to the `gh-pages` branch:
   ```bash
   npm run deploy
   ```
   This runs `vite build` then pushes `dist/` to the `gh-pages` branch via the
   `gh-pages` package.
3. In your GitHub repo: **Settings → Pages** → set **Source** to
   **Deploy from a branch**, branch **`gh-pages`**, folder **`/ (root)`**.
4. Wait for Pages to publish, then visit:
   ```
   https://your-username.github.io/watermelon/
   ```
5. Open **Settings** in the app and connect Microsoft and/or Slack.

### Troubleshooting

- **Blank page / 404 on assets** — `base` in `vite.config.js` does not match the
  repo name.
- **Auth redirect mismatch** — the redirect URI in Azure AD / Slack must exactly
  equal `https://your-username.github.io/watermelon/` (with trailing slash).
- **Slack calls fail with CORS / network error** — check `ALLOWED_ORIGIN` in the
  worker and the proxy URL in Settings.
