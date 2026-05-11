# BatchFlow

BatchFlow is a batch-based distributed job orchestrator built as a monorepo with separate frontend and backend apps.

## Apps

- `frontend/`: Next.js dashboard deployed to Vercel
- `backend/`: Express API, WebSocket server, and worker runtime deployed to Render
- `shared/`: shared types and constants

## Getting Started

Install dependencies from the repo root:

```bash
npm install
```

Run apps locally:

```bash
npm run dev:frontend
npm run dev:backend
npm run dev:worker
```

## Current Status

The repo currently includes the Phase 1 plan, shared contracts, and the initial application scaffolding.

