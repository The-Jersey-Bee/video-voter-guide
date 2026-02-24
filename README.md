# Video Voter Guide

An open-source, mobile-first video voter guide template for newsrooms and civic organizations. Film your candidate forum, upload the clips, and publish an interactive guide where voters watch each candidate answer key questions.

**See it in action:** [NJ-11 Democratic Primary Candidates Guide](https://nj11.jerseybee.org) by The Jersey Bee

## Features

- **Question-first navigation** — Voters browse by topic, not by candidate
- **Vertical video player** — Mobile-native with swipe between candidates, auto-replay
- **Deep linking** — Share a link to a specific candidate's answer (`#q=housing&cand=jane-doe`)
- **Responsive grid** — Candidate cards with headshots, works on all screen sizes
- **Google Sheets CMS** — Manage candidates, questions, and clips in a spreadsheet
- **GA4 analytics** — Track video plays, share clicks, and navigation (optional, disabled by default)
- **Iframe embedding** — Embed in any website with automatic resize
- **Non-participant handling** — Candidates who declined are shown separately
- **Share button** — Web Share API on mobile, clipboard fallback on desktop
- **Keyboard navigation** — Arrow keys and Escape in the video player

## Quick Start

```bash
git clone https://github.com/The-Jersey-Bee/video-voter-guide.git
cd video-voter-guide
npm install
npm run dev
```

Open `http://localhost:3000` to see the demo with sample data.

## Configuration

Edit **`site.config.ts`** — the single file that controls your guide:

| Field | Description |
|-------|-------------|
| `orgName` | Your organization name |
| `colors.*` | Brand colors (primary, secondary, and variants) |
| `fonts.*` | Display and body font families |
| `ga4MeasurementId` | Google Analytics 4 ID, or `null` to disable |
| `googleSheetId` | Your Google Sheet ID for data export |
| `videoBaseUrl` | Base URL where your videos are hosted |

If you change fonts, also update the Google Fonts `<link>` in `index.html`.

## Setting Up Your Data

See **[docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)** for the full step-by-step tutorial covering:

1. Creating and populating your Google Sheet
2. Exporting data to JSON
3. Deploying to Cloudflare Pages
4. Embedding in your website

## Video Hosting

See **[docs/VIDEO_HOSTING.md](docs/VIDEO_HOSTING.md)** for guidance on hosting your video files, including a recommended Cloudflare R2 walkthrough.

## Deployment

Connect your repo to [Cloudflare Pages](https://pages.cloudflare.com/):

- **Build command:** `npm run build`
- **Output directory:** `dist/`

Every push to `main` triggers an automatic deploy.

## Embedding

```html
<iframe
  src="https://your-guide.pages.dev"
  style="width: 100%; border: none;"
  allow="web-share"
></iframe>
<script src="https://cdn.jsdelivr.net/npm/iframe-resizer@4.3.9/js/iframeResizer.min.js"></script>
<script>iFrameResize({ checkOrigin: false }, 'iframe')</script>
```

See the [Setup Guide](docs/SETUP_GUIDE.md#embedding) for details.

## AI-Assisted Setup

If you use AI coding tools like Claude Code, OpenAI Codex, or Google Gemini, they can help you configure and deploy your guide. The repo includes an `AGENTS.md` file that gives AI tools full project context.

See **[docs/AI_SETUP_GUIDE.md](docs/AI_SETUP_GUIDE.md)** for example prompts and walkthroughs.

## Built With

- [React 19](https://react.dev/) + TypeScript
- [Vite 6](https://vite.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Google Sheets](https://sheets.google.com/) (CMS)
- [Cloudflare Pages](https://pages.cloudflare.com/) (hosting)
- [iframe-resizer](https://github.com/davidjbradshaw/iframe-resizer) (embed support)

## Contributing

See **[CONTRIBUTING.md](CONTRIBUTING.md)** for how to contribute.

## License

[GPL v3](LICENSE) — free to use, modify, and distribute. Derivative works must also be open source.

Built by [The Jersey Bee](https://jerseybee.org).
