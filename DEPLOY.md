# Deploying CCDV-F Study

This guide walks you through publishing the site to **GitHub** and deploying it on **Vercel**. Everything here is done by you — the project is already build-ready (`npm run build` passes).

## Prerequisites

- Node.js 18+ and a package manager (`npm` is assumed below).
- A [GitHub](https://github.com) account.
- A [Vercel](https://vercel.com) account (the free Hobby tier is enough).

## 1. Initialize a Git repository

From the project root:

```bash
git init
git add .
git commit -m "Initial commit: CCDV-F interactive study site"
```

> `node_modules/`, `.next/`, and the generated `content/search-index.json` are already git-ignored, so they won't be committed.

## 2. Push to GitHub

Create a new **empty** repository on GitHub (no README/license, to avoid conflicts), then connect and push. Replace the URL with your repo:

```bash
git branch -M main
git remote add origin https://github.com/<your-username>/ccdv-f-study.git
git push -u origin main
```

Alternatively, with the GitHub CLI:

```bash
gh repo create ccdv-f-study --public --source=. --remote=origin --push
```

## 3. Deploy on Vercel

### Option A — Import from the dashboard (recommended)

1. Go to [vercel.com/new](https://vercel.com/new).
2. Import your `ccdv-f-study` GitHub repository.
3. Vercel auto-detects **Next.js** — no configuration changes are needed:
   - Framework preset: **Next.js**
   - Build command: `next build` (default)
   - Output: handled automatically
4. Click **Deploy**. Your site goes live at `https://<project>.vercel.app`.

Every future `git push` to `main` triggers an automatic production deploy; pull requests get preview deployments.

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel        # first run links/creates the project (follow the prompts)
vercel --prod # deploy to production
```

## Configuration Notes

- **No environment variables** are required — the app has no backend and no secrets.
- `vercel.json` is included but minimal; Next.js on Vercel needs almost no configuration.
- The search index is regenerated during Vercel's build via the `prebuild` script, so it's always in sync with the content.

## Troubleshooting

- **Build fails on an MDX file** — check for a bare `<` followed by a letter/digit in prose (see the MDX gotcha in the README). Run `npm run build` locally to reproduce.
- **Content integrity errors** — run `npm run test`; it flags flashcards/quiz questions that reference a missing topic, or topics missing an MDX file.
- **Styles look unstyled on first load** — ensure the build completed; Tailwind classes are generated at build time.
