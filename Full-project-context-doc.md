# 🚀 BatchFlow — Distributed Job Orchestrator

---

# 🎯 Overview

BatchFlow is a **batch-based distributed job processing and observability system** that:

- Simulates load using **Batches → Jobs → Logs**
- Provides:
  - ✅ Real-time monitoring for active batches
  - ✅ Historical insights for completed batches
- Demonstrates:
  - Queue-based async processing
  - Retry handling
  - Observability (logs + analytics)

---

# 🧠 Core Concepts

```
Batch → Jobs → Logs
```

- **Batch**: A load test run
- **Job**: Individual task
- **Log**: Execution event

---

# 🏗️ Tech Stack

## Frontend
- Next.js (App Router)
- Tailwind CSS v3
- shadcn/ui
- WebSocket client

## Backend
- Node.js + Express.js
- Redis (queue)
- PostgreSQL (Neon)

## Deployment
- Frontend: Vercel
- Backend: Render / Railway
- DB: Neon
- Redis: Upstash

---

# 🧩 Architecture

```
Client (Next.js)
   │
   ├── REST APIs (Polling)
   └── WebSocket (Live Logs)
         │
         ▼
Backend (Express)
   │
   ├── PostgreSQL (Neon)
   ├── Redis (Upstash)
   └── Workers
```

---

# 🗃️ Data Model

## batches

```sql
id UUID PRIMARY KEY
client_id TEXT
name TEXT
total_jobs INT
status TEXT -- RUNNING | COMPLETED
created_at TIMESTAMP
completed_at TIMESTAMP
```

---

## jobs

```sql
id UUID PRIMARY KEY
batch_id UUID
status TEXT -- QUEUED | PROCESSING | SUCCESS | FAILED
retry_count INT
max_retries INT
created_at TIMESTAMP
updated_at TIMESTAMP
```

---

## logs

```sql
id UUID PRIMARY KEY
job_id UUID
message TEXT
level TEXT -- INFO | ERROR | WARN
event_type TEXT -- STARTED | SUCCESS | FAILURE | RETRY
created_at TIMESTAMP
```

---

# 🔑 User Identification (No Auth - Phase 1)

- Generate `clientId` in browser (localStorage)
- Attach to batches
- Used to fetch user-specific data

---

# 🔄 System Flows

---

## 1️⃣ Create Batch

```
POST /batches

→ Create batch
→ Create N jobs
→ Push jobs to Redis queue
```

---

## 2️⃣ Worker Processing

```
Worker:
  pop job (BRPOP)

  update job → PROCESSING
  log: STARTED

  try:
    process job
    update job → SUCCESS
    log: SUCCESS

  catch:
    retry_count++

    if retry_count <= max:
        delay (backoff)
        requeue job
        log: RETRY
    else:
        update job → FAILED
        log: FAILURE
```

---

## 3️⃣ Batch Completion Logic

Batch is COMPLETED when:

```
success + failed = total_jobs
```

---

# 🔴 Real-Time Strategy

---

## ✅ WebSocket (ONLY for logs)

Used in:
- Batch Dashboard → Live Logs

Backend:

```js
io.emit("log_update", { jobId, batchId, message, timestamp })
```

Frontend:

```js
socket.on("log_update", (log) => {
  if (log.batchId === activeBatchId) {
    prependLog(log)
  }
})
```

---

## 🔁 Polling (every 2–5s)

Used for:
- batch stats
- progress
- job counts

---

# 🖥️ UI Structure

---

## Screen 1: Batch List

### Features:
- Create Batch button
- Table of batches
- Status badges
- Navigate to dashboard

---

## Screen 2: Batch Dashboard

### Sections:

1. Header
   - Batch name + status

2. Progress Bar
   - `(success + failed) / total`

3. Stats Cards
   - Total
   - Success
   - Failed
   - Processing

4. Charts
   - Pie → status distribution
   - Line → throughput
   - Bar → retry distribution

5. Live Logs Feed
   - WebSocket stream
   - Latest first

---

# 🧠 Live vs Historical Behavior

| State | Behavior |
|------|--------|
RUNNING | Poll + WebSocket |
COMPLETED | Static snapshot |

---

# 🔌 API Design

---

## Batches

### Create
POST /batches

```json
{
  "name": "Load Test 1",
  "totalJobs": 100,
  "maxRetries": 3
}
```

---

### Get all
GET /batches?clientId=xyz

---

### Get details
GET /batches/:batchId

---

## Jobs

GET /batches/:batchId/jobs

---

## Logs

GET /batches/:batchId/logs

---

## Analytics

### Status counts
GET /batches/:batchId/stats

```json
{
  "total": 100,
  "success": 60,
  "failed": 10,
  "processing": 30
}
```

---

### Throughput
GET /batches/:batchId/throughput

---

### Retry stats
GET /batches/:batchId/retries

---

# 📊 Analytics Queries

---

## Status distribution

```sql
SELECT status, COUNT(*)
FROM jobs
WHERE batch_id = $1
GROUP BY status;
```

---

## Throughput

```sql
SELECT DATE_TRUNC('minute', created_at), COUNT(*)
FROM jobs
WHERE batch_id = $1
GROUP BY 1;
```

---

## Retry distribution

```sql
SELECT retry_count, COUNT(*)
FROM jobs
WHERE batch_id = $1
GROUP BY retry_count;
```

---

# ⚙️ Redis Queue

---

## Push job

```bash
LPUSH queue jobPayload
```

---

## Worker consume

```bash
BRPOP queue
```

---

## Job Payload

```json
{
  "jobId": "uuid",
  "batchId": "uuid",
  "retryCount": 0
}
```

---

# 🧠 Design Decisions

- Relational DB → better analytics queries
- Logs stored separately → scalable
- WebSocket only for logs → controlled complexity
- Polling for stats → simpler
- Batch abstraction → real-world simulation

---

# 🔐 Future: Auth (NextAuth Ready)

- Replace `client_id` with `user_id`
- APIs remain same
- Plug in session-based auth

---

# 📁 Frontend Structure

```
/app
  /batches
    page.tsx
    [id]/page.tsx

/components
  BatchTable.tsx
  StatsCards.tsx
  Charts.tsx
  LogsFeed.tsx

/lib
  api.ts
  websocket.ts
```

---

# 📁 Backend Structure

```
/src
  /controllers
  /routes
  /services
  /workers
  /queue
  /db
```

---

# 🚀 Phase Plan

---

## Phase 1 (Current)

- Batches + Jobs + Logs
- Retry logic
- Polling + WebSocket (logs only)
- Dashboard UI

---

## Phase 2

- Processing queue
- Worker crash recovery
- Advanced metrics

---

## Phase 3

- Auth (NextAuth)
- Multi-user isolation
- Rate limiting

---

# 🎯 Interview Talking Points

- Batch abstraction for load testing
- Hybrid real-time system
- Retry mechanism
- Observability-first design
- SQL for analytics-heavy queries

---

# 🏁 Final Goal

A clean, demo-ready system that shows:

- Distributed processing
- Real-time monitoring
- Failure handling
- System design maturity

---

# 🚀 Ready to Build