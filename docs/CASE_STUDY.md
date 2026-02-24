# Case Study: NJ-11 Special Election Video Voter Guide

> **Note:** This case study is a work in progress. Sections marked with *[TBD]* need editorial input.

## Background

In early 2026, New Jersey's 11th Congressional District held a special election after Rep. Mikie Sherrill was elected governor. Eleven Democratic candidates entered the primary. The Jersey Bee, a local news outlet, organized a candidate forum and built an interactive video voter guide to make the footage accessible to voters.

**Live site:** [nj11.jerseybee.org](https://nj11.jerseybee.org)

## Organizing the Forum

*[TBD — How candidates were invited, timeline, logistics, venue selection, coordination with campaigns]*

## Filming

*[TBD — Equipment used, why vertical video was chosen, studio/location setup, how each candidate was recorded, time allotted per question]*

### Why Vertical Video?

The guide was designed mobile-first. Vertical (9:16) video fills the phone screen naturally and feels native to how people consume short-form content. It also works well in the swipeable player format where viewers navigate between candidates.

## Editing

*[TBD — How raw footage was cut into per-question clips, tools used for editing, adding captions/subtitles, file naming conventions, quality control process]*

## Content Management

Data was managed in a Google Sheet with five tabs:

1. **Settings** — Election title, intro text, external links
2. **Sections** — Question categories (Introduction, Lightning Round, Policy, Closing)
3. **Questions** — The 7 prompts asked to each candidate
4. **Candidates** — All 11 candidates, ordered alphabetically, with participation status
5. **Clips** — 70+ video clips (one per candidate per question), with URLs, posters, captions

The `export-data` script fetched this sheet and generated a single JSON file bundled into the app at build time. Updates to the sheet were reflected by re-running the export and deploying.

## Publishing

*[TBD — How the guide was embedded on the main site, social media promotion strategy, outreach to voters]*

## Results

*[TBD — Traffic/analytics highlights, engagement metrics, voter feedback, media coverage]*

## Lessons Learned

*[TBD — What worked well, what to do differently, advice for other newsrooms considering this format]*

---

*This case study is part of the [Video Voter Guide](https://github.com/The-Jersey-Bee/video-voter-guide) open-source project.*
