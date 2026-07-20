# Ray Web

Ray Web is the public web/PWA interface for Ray, a personal AI assistant with one memory across the web site, Telegram bot, and future mobile integrations.

Live site:

```text
https://kaimo-ki.github.io/ray_site/
```

Backend/API repository:

```text
https://github.com/Kaimo-ki/ray_bot
```

## What Works Now

- Public product site with Ray positioning and install sections.
- Web chat connected to Ray API through `window.RAY_API_URL`.
- Ray ID account UI with email + password through Ray API.
- Local fallback account storage if the API is unavailable.
- Telegram linking through `/link <code>`.
- Telegram login through `/login <code>` after linking.
- PWA manifest and service worker for installable web app behavior.
- iPhone/Android/Windows install instructions.
- Windows shortcut installer and uninstall helper in `downloads/`.
- Floating Ray companion button inside the site.
- Companion color can be changed.
- Companion settings panel can be closed.
- Companion can be dragged inside the site after permission.
- Basic privacy/onboarding copy for memory and companion permissions.

## Technologies

- Static HTML/CSS/JavaScript
- GitHub Pages hosting
- PWA manifest + service worker
- Browser `fetch` API for Ray API calls
- LocalStorage for local UI settings/session state
- Optional Supabase JS script is loaded for future/experimental Google OAuth
- Lucide icons through CDN
- Node.js helper scripts for local dev/checks, without npm dependencies

## Project Structure

```text
.
├── index.html                 # Main site/PWA markup
├── styles.css                 # Responsive product UI and companion design
├── script.js                  # Chat, auth, Telegram link/login, PWA, companion logic
├── config.js                  # Public runtime config: API URL and optional public auth config
├── manifest.webmanifest       # PWA install metadata and icons
├── sw.js                      # Service worker cache
├── offline.html               # Offline fallback
├── assets/                    # Ray avatar, hero image, PWA icons
├── downloads/                 # Windows helper installers, uninstall script, zip artifacts
├── scripts/dev-server.mjs     # Local server that serves the site under /ray_site/
├── scripts/check.mjs          # JavaScript syntax check
├── package.json               # Local dev/check commands
├── .env.example               # Safe placeholder config for future tooling
└── README.txt                 # Older short notes, kept for compatibility
```

## Install Locally From Zero

1. Clone the repository:

```bash
git clone https://github.com/Kaimo-ki/ray_site.git
cd ray_site
```

2. Install nothing if you only want to view/edit files. The site is static.

3. If using Node scripts, make sure Node.js is installed.

4. Start local server:

```bash
npm run dev
```

Windows PowerShell can block `npm.ps1` on some machines. In that case use:

```powershell
npm.cmd run dev
```

5. Open:

```text
http://127.0.0.1:8765/ray_site/
```

The custom dev server is used because the production site lives under `/ray_site/`. Opening `index.html` directly or serving it from `/` can break manifest/service-worker paths.

## Commands

```bash
npm run dev
npm run check
npm run build
```

PowerShell fallback:

```powershell
npm.cmd run dev
npm.cmd run check
npm.cmd run build
```

Notes:

- `npm run dev` starts a local static server.
- `npm run check` validates JavaScript syntax.
- `npm run build` currently runs the same syntax check because this is a static site with no bundler.

## Environment File

This repository does not currently read `.env` at runtime. The public site reads `config.js` directly.

Use `.env.example` only as a safe template for future build/deploy tooling:

```env
RAY_API_URL=https://your-ray-api.up.railway.app
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=sb_publishable_replace_with_public_key
```

Do not put backend secrets here. Public browser code must never contain Telegram tokens, Groq keys, Gemini keys, Postgres URLs, or service role keys.

## Required Public Config

`config.js` must define:

```js
window.RAY_API_URL = "https://your-ray-api.up.railway.app";
window.SUPABASE_URL = "https://your-project.supabase.co";
window.SUPABASE_ANON_KEY = "sb_publishable_replace_with_public_key";
```

Current product source of truth:

- Ray API email/password auth is primary.
- Supabase/Google OAuth is optional/experimental and should be verified before presenting it as production-ready.

## Run Frontend

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:8765/ray_site/
```

## Run Backend And Bot

Backend and bot are not in this repo. Use `ray_bot`:

```bash
git clone https://github.com/Kaimo-ki/ray_bot.git
cd ray_bot
cp .env.example .env
docker compose up -d --build
```

Then set this site's API URL to:

```js
window.RAY_API_URL = "http://127.0.0.1:8000";
```

Do not commit local API URLs unless intentionally changing development defaults.

## Database

The site has no database. It talks to Ray API.

Database ownership is in `ray_bot`:

- local fallback: SQLite
- production/local Docker: Postgres
- shared memory requires the same `DATABASE_URL` for `ray-api` and `ray-bot`

## Check Main Functions

1. Start Ray API or confirm the live Railway API is online.
2. Open Ray Web.
3. Create a Ray ID with email + password.
4. Confirm the auth panel changes to signed-in state.
5. Send a chat message.
6. Send `Запомни: моя цифра 5`.
7. Generate a Telegram link command.
8. Send `/link <code>` to `@rey_helper_bot`.
9. Ask Telegram: `какая моя цифра?`
10. Install PWA and confirm the icon/standalone window look correct.

## Build

No bundled production build exists yet. The deployed site is the repository files themselves.

Current validation:

```bash
npm run build
```

This checks syntax only. If the project later moves to Vite/React/etc., replace this with a real build pipeline.

## Docker

There is no Dockerfile for this static site yet.

What exists:

- static files
- GitHub Pages deploy model
- Node local dev server

What is missing for Docker:

- `Dockerfile` for nginx or another static server
- optional `docker-compose.yml` service for `ray-site`
- port mapping, likely `8080:80`
- a config injection strategy for `config.js`

Expected future Docker services:

- `ray-site` static web server
- `ray-api` from `ray_bot`
- `ray-bot` from `ray_bot`
- `postgres`

Until that is added, do not claim Docker deployment for the site is production-ready.

## Install PWA

iPhone:

1. Open the live site in Safari.
2. Tap Share.
3. Tap Add to Home Screen.

Android:

1. Open the live site in Chrome.
2. Tap Install app or Add to Home Screen.

Windows:

1. Open the live site in Chrome or Edge.
2. Use the browser install button.
3. Or use the Windows helper from the install section.

If the installed PWA shows an old version, refresh the browser tab first, close the installed app, and reopen it. If it still shows old files, uninstall and install again after the service worker version changes.

## Deployment

Current deployment is GitHub Pages from the `main` branch of `Kaimo-ki/ray_site`.

Expected GitHub Pages settings:

- Source: deploy from branch or GitHub Pages workflow, depending on repository settings.
- Branch: `main` if using branch deploy.
- Folder: repository root if branch deploy is used for this repo.

Before deploy:

1. Run `npm run check`.
2. Confirm `config.js` points to the correct public Ray API URL.
3. Bump cache/version query strings in `index.html` and `sw.js` when changing CSS/JS.
4. Push to GitHub.
5. Open the live URL in a normal browser and installed PWA.

## Known Issues And Limits

- Google login is not fully production-proven. Ray API account login is the primary reliable flow.
- Local fallback accounts are only for one browser/device and are not shared with Telegram.
- The companion button moves only inside the site; it cannot move across all apps unless the separate Windows companion is installed.
- Windows companion is a helper script, not a full native product yet.
- Web/native voice needs more testing.
- PWA installation behavior differs between iPhone, Android, Chrome, Edge, and Windows.
- Service worker cache can make old versions appear after deploy.
- The site currently loads some external CDN scripts, so full offline mode is limited.

## Fully Ready

- Static GitHub Pages site.
- Responsive product presentation.
- PWA manifest and service worker.
- Ray API chat call.
- Ray API account UI.
- Telegram link/login UI.
- Companion button inside the web site.
- Windows install/uninstall helper files.

## Partially Ready

- PWA install: implemented, still needs device QA.
- Google OAuth: UI/config exists, but production behavior needs verification.
- Desktop companion: install helper exists, but native voice/global screen access is not complete.
- Product copy/design: improved, but still needs final content review before public launch.

## Not Done

- Full native mobile apps.
- App Store / Play Market release.
- Static-site Docker deployment.
- Real build pipeline.
- Full automated UI tests.
- Final privacy policy/legal text.

## First Tasks For The Next Developer

1. Run `npm run dev` and open `http://127.0.0.1:8765/ray_site/`.
2. Run `ray_bot` locally or confirm Railway API is live.
3. Test account creation, login, web chat, Telegram linking, and PWA install.
4. Decide whether to keep Google OAuth visible or hide it until fully verified.
5. Add device QA notes for iPhone, Android, Windows Chrome, and Windows Edge.
