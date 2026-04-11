# SakuraMind Frontend

This directory contains the Next.js application for SakuraMind, including UI, client-side auth, dashboard views, and API routes that orchestrate Python inference.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI

## Folder Highlights

- [app](app): route handlers and pages
- [app/(app)](app/(app)): authenticated application shell pages
- [app/api](app/api): server routes for analyze, sentiment, and mel assets
- [components](components): UI and feature components
- [hooks](hooks): voice recording and utility hooks
- [lib](lib): storage, auth, report helpers, and utility logic

## Run Locally

From this directory:

```bash
pnpm install
pnpm dev
```

App URL: http://localhost:3000

Production build:

```bash
pnpm build
pnpm start
```

Lint:

```bash
pnpm lint
```

## Frontend Routes

Public:

- /
- /login
- /signup

Protected (via AuthGuard in app shell):

- /dashboard
- /voice
- /reports
- /settings

## API Routes in This App

### POST /api/analyze

- Accepts multipart form data with field voiceBlob
- Converts input audio to WAV (ffmpeg)
- Executes Python inference script in [../backend/inference.py](../backend/inference.py)
- Returns normalized emotion + confidence

Example response:

```json
{
  "emotion": "happy",
  "confidence": 91,
  "_t": 1711111111111
}
```

### GET /api/sentiment

- Reads latest result from [../history.txt](../history.txt)
- Returns last emotion + confidence and file mtime

### GET /api/mel

- Returns [../mel.png](../mel.png) as image/png

## Authentication Behavior

Auth is local-browser based and intended for prototype/demo usage.

- User records are stored in localStorage
- Passwords are hashed with SHA-256 before storage
- Session behavior supports Remember me:
  - Checked: persists in localStorage
  - Unchecked: stored in sessionStorage only

## Notes for Developers

- Voice recordings require microphone permission
- Minimum recording duration is 4 seconds
- API analysis depends on Python environment and model file availability in repository root structure

## Quick Troubleshooting

- If /api/analyze fails:
  - verify ffmpeg availability
  - verify Python dependencies are installed in root venv
  - verify [../Model/emotion_model.pth](../Model/emotion_model.pth) exists
- If login loops:
  - clear sakuramind session keys from browser storage
