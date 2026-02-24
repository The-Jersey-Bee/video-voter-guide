# Video Voter Guide

An open-source, mobile-first video voter guide template. Built with React 19, TypeScript, Vite 6, and Tailwind CSS 4. Uses Google Sheets as a CMS and deploys to Cloudflare Pages.

## Key Files

| File | Purpose |
|------|---------|
| `site.config.ts` | **Single config file** — org name, colors, fonts, GA4 ID, Sheet ID, video URL |
| `lib/config.ts` | Config types (`SiteConfig` interface) and re-export |
| `App.tsx` | Main app component — renders sections, handles deep linking |
| `index.tsx` | Entry point — injects CSS custom properties from config, mounts React |
| `index.html` | HTML shell — Google Fonts link, iframe-resizer script |
| `types.ts` | TypeScript types: `ElectionInfo`, `Section`, `Question`, `Candidate`, `Clip`, `AppData` |
| `data/guide-data.json` | Static data file (demo data included, replaced by `npm run export-data`) |

## Directories

| Directory | Purpose |
|-----------|---------|
| `components/` | React components: `PlayerOverlay.tsx`, `QuestionSection.tsx` |
| `hooks/` | `useAppData.ts` (loads guide data), `useIframeResize.ts` (embed support) |
| `lib/` | `analytics.ts` (GA4 events), `config.ts` (config types), `googleSheets.ts` (Sheets API client) |
| `scripts/` | `export-sheets-to-json.js` (Google Sheets → JSON export) |
| `src/` | `styles.css` (Tailwind theme with CSS custom properties) |
| `templates/` | CSV templates for Google Sheets tabs |

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server at localhost:3000 |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run export-data` | Export Google Sheets → `data/guide-data.json` |

## Config System

Edit `site.config.ts` to customize. Colors/fonts are injected as CSS custom properties at runtime (`index.tsx`), overriding the Tailwind `@theme` defaults in `src/styles.css`.

GA4 is disabled by default (`ga4MeasurementId: null`). Set a measurement ID to enable.

## Data Model

Five entity types form the data model:

1. **ElectionInfo** — Title, intro HTML, external links (voting info, towns, filming location)
2. **Section** — Groups questions (e.g., "Introduction", "Policy", "Closing")
3. **Question** — A prompt shown to candidates, belongs to a section
4. **Candidate** — Name, slug, headshot, participation status
5. **Clip** — Video for one candidate answering one question (video URL, poster, captions, transcript)

## Data Flow

```
Google Sheets → npm run export-data → data/guide-data.json → bundled at build time
```

The app imports `guide-data.json` statically via `useAppData` hook. No runtime API calls.

## Deployment

Cloudflare Pages: connect repo, build command `npm run build`, output directory `dist/`.

## Embedding

The app supports iframe embedding with automatic resize via iframe-resizer. The `useIframeResize` hook handles the postMessage protocol. The app adds `embed-mode` class to `<html>` when embedded, which disables internal scrolling.

Deep linking: `#q={question-slug}&cand={candidate-slug}`

## Coding Standards

- React 19 + TypeScript (strict mode)
- Tailwind CSS 4 with `@theme` custom properties
- No backend — static site only
- All brand colors via CSS custom properties (never hardcode hex values in components)
- Tailwind classes use `brand-*` prefix (e.g., `bg-brand-primary`, `text-brand-secondary-dark`)
