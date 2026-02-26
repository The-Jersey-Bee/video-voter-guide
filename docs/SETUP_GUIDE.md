# Setup Guide

This guide walks you through setting up your own video voter guide from scratch.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- A [GitHub](https://github.com/) account
- A [Google](https://accounts.google.com/) account (for Google Sheets)
- Video files of your candidates (MP4 format)

## Step 1: Get the Code

**Option A: Use as template (recommended)**

Click "Use this template" on the [GitHub repo](https://github.com/The-Jersey-Bee/video-voter-guide) to create your own copy.

**Option B: Fork**

Fork the repository if you want to receive future updates.

**Option C: Clone directly**

```bash
git clone https://github.com/The-Jersey-Bee/video-voter-guide.git my-voter-guide
cd my-voter-guide
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Edit Your Config

Open **`site.config.ts`** and update:

```typescript
const config: SiteConfig = {
  orgName: 'Your Organization Name',

  colors: {
    primary: '#C06328',        // Your main brand color
    primaryLight: '#DFAB40',   // Lighter version
    primaryDark: '#6C2F09',    // Darker version (for hover states)
    secondary: '#789FD4',      // Secondary accent
    secondaryLight: '#E1EBF9', // Light background tint
    secondaryDark: '#2B2E34',  // Dark headings
  },

  fonts: {
    display: 'Red Hat Display',
    body: 'Red Hat Text',
  },

  ga4MeasurementId: null,  // Or 'G-XXXXXXXXXX' for analytics

  googleSheetId: '',       // You'll fill this in Step 4
  videoBaseUrl: '',        // You'll fill this after uploading videos
};
```

If you change fonts, update the Google Fonts `<link>` tag in `index.html` too. Generate a new link at [fonts.google.com](https://fonts.google.com/).

## Step 4: Set Up Your Google Sheet

### Create the Sheet

1. Go to [Google Sheets](https://sheets.google.com/) and create a new spreadsheet
2. Name it something like "My Voter Guide Data"

### Create 5 Tabs

Rename the default tab and create new tabs with these exact names:

1. `settings`
2. `sections`
3. `questions`
4. `candidates`
5. `clips`

### Import Template Data

For each tab:

1. Go to **File > Import > Upload**
2. Upload the corresponding CSV from the `templates/` folder:
   - `templates/1_settings.csv` → `settings` tab
   - `templates/2_sections.csv` → `sections` tab
   - `templates/3_questions.csv` → `questions` tab
   - `templates/4_candidates.csv` → `candidates` tab
   - `templates/5_clips.csv` → `clips` tab
3. Choose **"Replace current sheet"** as the import option

### Fill In Your Data

- **settings**: Update the title, intro HTML, and any external URLs
- **sections**: Add your question categories (e.g., Introduction, Healthcare, Economy)
- **questions**: Add each question prompt, linked to a section by `section_id`
- **candidates**: Add each candidate with a unique `id` and `slug`. Set `participated` to `FALSE` for anyone who declined
- **clips**: One row per candidate-question combination. Fill in `video_src` with the URL of each video file

### Publish the Sheet

1. Go to **File > Share > Publish to web**
2. Select **Entire Document**
3. Click **Publish**

### Copy Your Sheet ID

From your Google Sheet URL:
```
https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit
```

Copy the long string between `/d/` and `/edit`.

### Configure the Environment

Create a `.env` file in your project root:

```bash
cp .env.example .env
```

Edit `.env` and paste your Sheet ID:

```
VITE_GOOGLE_SHEET_ID=your_sheet_id_here
```

## Step 5: Export Data

```bash
npm run export-data
```

This fetches data from your Google Sheet and saves it to `data/guide-data.json`.

## Step 6: Test Locally

```bash
npm run dev
```

Open `http://localhost:3000` and verify:

- Your election title and intro text appear
- All sections expand/collapse
- Candidate cards show with correct names
- Clicking a candidate opens the video player
- Non-participating candidates appear in a separate section

## Step 7: Deploy to Cloudflare Pages

1. Create a free [Cloudflare](https://dash.cloudflare.com/) account
2. Go to **Workers & Pages > Create > Pages > Connect to Git**
3. Select your GitHub repository
4. Configure build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist/`
5. Click **Save and Deploy**

Your guide will be live at `https://your-project.pages.dev`. Every push to `main` triggers a new deploy.

### Custom Domain (Optional)

In Cloudflare Pages settings, go to **Custom domains** and add your domain. You'll need to update your DNS to point to Cloudflare.

## Step 8: Embed in Your Website

Add this to any page where you want the voter guide to appear:

```html
<iframe
  id="voter-guide"
  src="https://your-project.pages.dev"
  style="width: 100%; border: none; min-height: 600px;"
  allow="web-share"
></iframe>
<script src="https://cdn.jsdelivr.net/npm/iframe-resizer@4.3.9/js/iframeResizer.min.js"></script>
<script>
  iFrameResize({
    checkOrigin: ['https://your-project.pages.dev'],
    heightCalculationMethod: 'documentElementOffset'
  }, '#voter-guide');
</script>
```

The iframe will automatically resize to match the content height.

## Workflow for Non-Technical Editors

If you're an editor or content manager who doesn't use the command line, here's how to update the voter guide after initial setup:

1. **Edit the Google Sheet** — Update candidate info, questions, or video URLs directly in the spreadsheet
2. **Ask a developer to re-export** — They'll run `npm run export-data` and push the changes
3. **Or use GitHub's web editor** — If the data file is small, you can edit `data/guide-data.json` directly on GitHub:
   - Navigate to the file on GitHub
   - Click the pencil icon to edit
   - Make your changes and commit
   - Cloudflare Pages will auto-deploy

**Tip:** For a fully no-code workflow, pair the Google Sheet with a GitHub Action that auto-exports on a schedule or webhook trigger.

## Updating Content

When you need to update your guide (new candidates, corrected info, etc.):

1. Edit your Google Sheet
2. Run `npm run export-data` to refresh the JSON
3. Commit and push — Cloudflare Pages auto-deploys

```bash
npm run export-data
git add data/guide-data.json
git commit -m "update guide data"
git push
```
