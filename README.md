# RepoLens — GitHub Repository Explainer

Paste a GitHub URL → get AI architecture diagrams, file explanations, setup guide, and a junior-engineer walkthrough. Powered by Google Gemini.

## Quick Start

```bash
npm install
cp .env.example .env.local
# Add GEMINI_API_KEY to .env.local
npm run dev
```

Open http://localhost:3000

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Free at aistudio.google.com/app/apikey |
| `GITHUB_TOKEN` | Optional | Raises GitHub rate limit 60→5000/hr |

## Deploy to Vercel

```bash
npm i -g vercel
vercel
vercel env add GEMINI_API_KEY
vercel --prod
```

## Stack

Next.js 15 · Gemini 2.0 Flash · Octokit · Mermaid · Zustand · Framer Motion · Tailwind
