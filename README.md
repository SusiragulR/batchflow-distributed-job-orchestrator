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

## Free Render Deployment Mode

If you want to avoid a paid Render background worker, the backend can run in a single
Render web service with the worker embedded inside the API process.

Set these backend env vars in Render:

```env
RUN_WORKER_IN_API=true
WORKER_TRIGGER_SECRET=choose-a-long-random-secret
WORKER_TRIGGER_BURST_LIMIT=10
```

Recommended Render web service commands:

```bash
npm install && npm run build --workspace shared && npm run build --workspace backend
```

```bash
node backend/dist/server.js
```

To help wake the free Render service after idle periods, configure an external ping
service such as cron-job.org or UptimeRobot to call:

```text
GET https://<your-render-service>.onrender.com/worker-trigger?key=<WORKER_TRIGGER_SECRET>
```

Recommended interval:

- every 10 minutes

That request both wakes the web service and triggers a short worker burst so queued
jobs can resume processing without needing a separate paid worker instance.

## Current Status

The repo currently includes the Phase 1 plan, shared contracts, and the initial application scaffolding.
