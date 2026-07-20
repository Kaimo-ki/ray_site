# Ray Web Handoff

Last updated: 2026-07-20

This file is for the developer taking over the public site/PWA repository.

## Current State

Ray Web is a static site hosted on GitHub Pages:

```text
https://kaimo-ki.github.io/ray_site/
```

It is connected to the backend in:

```text
https://github.com/Kaimo-ki/ray_bot
```

The site is meant to be both:

- a polished product presentation for Ray;
- an installable PWA/chat surface connected to Ray API.

## Recent Changes

- Added `README.md` with setup, deploy, Docker/PWA notes, and known limits.
- Added this `HANDOFF.md`.
- Added concrete `TODO.md`.
- Added `.gitignore`.
- Added `.env.example` with safe public placeholders only.
- Added `package.json` with `dev`, `check`, and `build` scripts.
- Added `scripts/dev-server.mjs` to serve the site under `/ray_site/` locally.
- Added `scripts/check.mjs` for JS syntax validation.

## Functions That Work

- Site opens as a static GitHub Pages app.
- Main layout and product sections exist.
- Chat can call `RAY_API_URL`.
- Ray API email/password auth UI exists.
- Signed-in state is stored in localStorage/session state.
- Telegram link flow can request a `/link` code from Ray API.
- Telegram login flow can request a `/login` code from Ray API.
- PWA manifest exists with icons and shortcuts.
- Service worker caches core assets.
- Companion button can be shown/hidden, dragged inside the site, and recolored.
- Companion settings panel has a close button.
- Windows install/uninstall helper files exist in `downloads/`.

## Functions To Verify

- Google OAuth on the live site.
- Email/password creation on a clean browser profile.
- Password login after refresh and after PWA install.
- Telegram linking after a fresh account.
- Telegram login after linking.
- Memory continuity between web chat and Telegram bot.
- PWA install on iPhone Safari.
- PWA install on Android Chrome.
- PWA install on Windows Chrome/Edge.
- Service worker update after deploy.
- Windows helper install and uninstall flow.

## Unstable Or Risky Parts

- `config.js` is public. It may contain only browser-safe values. Never put secret keys there.
- Supabase/Google code exists but Ray API email/password should remain primary until OAuth is verified.
- Local fallback account storage can confuse testing because it is not a real shared account.
- Browser/PWA caches can show stale CSS/JS.
- Desktop companion is a helper, not a full native app.
- Full-device floating button behavior is not possible from a normal web page; it needs native app/extension/OS permissions.

## Recently Changed Files

- `README.md`
- `HANDOFF.md`
- `TODO.md`
- `.gitignore`
- `.env.example`
- `package.json`
- `scripts/dev-server.mjs`
- `scripts/check.mjs`

## Remaining Tasks By Priority

## Critical

- Test registration/login from a clean browser profile.
- Test account state after page refresh.
- Test Telegram linking with the live bot.
- Confirm `config.js` points to the correct live `ray-api`.
- Confirm `WEB_ALLOWED_ORIGINS` on Ray API includes `https://kaimo-ki.github.io`.
- Decide whether Google OAuth should be shown or hidden until it is fully working.

## Important

- Run device QA for PWA install.
- Add clear success/error states for auth actions.
- Add automated smoke checks with Playwright or similar.
- Confirm service worker cache version is bumped when files change.
- Improve product copy and screenshots before public/demo use.

## Later

- Add a real build system only if the project needs components, bundling, or env injection.
- Add Docker/nginx static deployment.
- Add privacy policy and terms pages.
- Add native mobile app or wrapper only after PWA is stable.
- Add official WhatsApp/Instagram integrations later through backend APIs.

## Step-By-Step Plan

1. Run `npm run dev`.
2. Open `http://127.0.0.1:8765/ray_site/`.
3. Run `npm run check`.
4. Start or verify Ray API.
5. Create a Ray account.
6. Refresh and confirm the account remains signed in.
7. Send a chat message.
8. Link Telegram with `/link <code>`.
9. Test PWA install.
10. Record device-specific issues in `TODO.md`.

## To Install And Run On Another Computer

Required:

- Git
- Node.js
- Access to the backend API URL

Commands:

```bash
git clone https://github.com/Kaimo-ki/ray_site.git
cd ray_site
npm run dev
```

If Windows PowerShell blocks `npm.ps1`, use:

```powershell
npm.cmd run dev
```

Open:

```text
http://127.0.0.1:8765/ray_site/
```

No `npm install` is required right now because there are no package dependencies.

## Release Requirements

- `npm run check` passes.
- `config.js` uses the correct public API URL.
- Auth flow works in a clean browser.
- Chat works.
- Telegram linking works.
- PWA install works on at least one mobile and one desktop browser.
- Service worker cache name is updated after CSS/JS changes.
- No secrets are committed.
- README/HANDOFF/TODO are current.

## Docker Work

Not production-ready for this repo yet.

Needed:

- Add `Dockerfile` with nginx or another static server.
- Decide how to inject `config.js` at container startup.
- Add optional `docker-compose.yml` service `ray-site`.
- Expose site on port `8080` or another documented port.
- Connect it to `ray-api`.

## PWA Work

Already present:

- `manifest.webmanifest`
- `sw.js`
- icons
- offline page
- install UI

Needs verification:

- iPhone Add to Home Screen.
- Android install prompt.
- Windows Chrome/Edge install.
- Cache update after deploy.
- Installed icon should match Ray companion/brand.

## Deploy Work

Current target:

- GitHub Pages from `Kaimo-ki/ray_site`

Before pushing:

```bash
npm run check
```

After pushing:

- Open live URL.
- Hard refresh.
- Check installed PWA.
- Confirm chat uses live API.

## Diploma Defense Checklist

- Show public site.
- Show account creation/login.
- Show chat.
- Show Telegram link.
- Show memory across web and Telegram.
- Show PWA install path.
- Explain what is real now and what is future: Google/SMS/native apps are not finished.
- Explain privacy permissions for memory and companion.
