# AI-Assisted Setup Guide

You can use AI coding tools to help you configure, customize, and deploy your video voter guide. This guide covers three popular tools.

## How It Works

This repo includes an `AGENTS.md` file that gives AI coding tools full context about the project structure, config system, commands, and data model. When you open the project with an AI tool, it reads this file and understands how everything fits together.

## Claude Code

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) is Anthropic's CLI tool for working with codebases.

### Install

```bash
npm install -g @anthropic-ai/claude-code
```

### Use

```bash
cd video-voter-guide
claude
```

Claude reads `AGENTS.md` automatically and understands the project.

### Example Prompts

**Initial setup:**
> "Help me set up a voter guide for the Oakland mayoral race with 5 candidates"

**Configuration:**
> "Update site.config.ts with my organization name 'Oakland Voice' and our brand colors blue (#1E40AF) and gold (#F59E0B)"

**Google Sheets:**
> "Walk me through setting up my Google Sheet and exporting data"

**Adding candidates:**
> "Add these 5 candidates to my guide-data.json: Maria Santos, James Park, Devon Williams, Rachel Green, Omar Hassan"

**Deployment:**
> "Help me deploy this to Cloudflare Pages"

**Troubleshooting:**
> "The build is failing with a TypeScript error — help me fix it"

## OpenAI Codex

[Codex](https://openai.com/index/openai-codex/) reads `AGENTS.md` for project context.

### Use

Open the project in Codex and use similar prompts as above. Codex can edit files, run commands, and help you through the entire setup process.

## Google Gemini

Upload the repo or key files to [Google AI Studio](https://aistudio.google.com/) or use Gemini in your IDE.

### Key Files to Share

If you can't share the full repo, upload these files for context:

1. `AGENTS.md` — Project overview and structure
2. `site.config.ts` — The config file you'll edit
3. `types.ts` — Data model definitions
4. `data/guide-data.json` — Example data structure

### Example Prompts

> "I have a voter guide template. Here are the key files. Help me configure it for a city council race with 3 candidates."

> "Generate a guide-data.json file for my election with these candidates and questions: [paste your details]"

## Tips

- **Be specific about your election.** Tell the AI the office, number of candidates, and questions you asked.
- **Share your Google Sheet structure.** If you're having trouble with the data export, share a screenshot of your sheet.
- **Ask for help with colors.** AI tools can suggest color palettes that match your brand.
- **Use it for troubleshooting.** Paste error messages and ask for help — the AI understands the project context.
- **Iterate.** Start with basic setup, then ask for customizations one at a time.
