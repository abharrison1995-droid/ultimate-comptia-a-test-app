# A+ Revision Guide

Mobile-friendly study app for **CompTIA A+ V15** — Core 1 (**220-1201**) and Core 2 (**220-1202**).

- Revision notes per exam objective
- 10-question mini mocks per subdomain
- 25-question domain mocks
- Offline-capable PWA (install to home screen)
- Auto-saved quiz progress and score tracking

## Use it on your phone (recommended)

### 1. Deploy to GitHub Pages

1. Merge the latest PR to `main` (or push `main` directly).
2. On GitHub: **Settings → Pages → Build and deployment**
   - Source: **GitHub Actions**
3. Push to `main` — the workflow in `.github/workflows/pages.yml` publishes the site.

Your live URL will be:

`https://abharrison1995-droid.github.io/ultimate-comptia-a-test-app/`

### 2. Install as an app

**iPhone (Safari)**

1. Open the live URL in Safari
2. Tap **Share** → **Add to Home Screen**
3. Open from the home screen — runs full-screen like a native app

**Android (Chrome)**

1. Open the live URL
2. Tap **Install app** (banner) or **⋮ → Install app / Add to Home screen**

The service worker caches the app for offline revision after the first visit.

## Local development

No build step required — static files only.

```bash
# Serve locally
npx serve .

# Run regression tests
npm install
npx playwright install chromium
node test-app.mjs
```

Open `http://localhost:3000` (or whatever `serve` prints).

## Project structure

| File | Purpose |
|------|---------|
| `index.html` | App shell, styles, content, and logic |
| `manifest.webmanifest` | PWA install metadata |
| `sw.js` | Offline cache |
| `icons/` | App icons (192 / 512 px) |

## Exam note

Content follows the A+ domain structure (mobile, networking, hardware, OS, security, etc.). The app is branded for **220-1201 / 220-1202 (V15)**. Review [CompTIA's official objectives](https://www.comptia.org/certifications/a) for the latest blueprint details.

## Custom domain (optional)

In **Settings → Pages**, add a custom domain (e.g. `aplus.yourdomain.com`) and point DNS to GitHub Pages.
