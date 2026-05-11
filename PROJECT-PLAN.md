# BatchFlow Phase 1 Implementation Plan

## Summary

Build BatchFlow as a single repository with two deployable apps:

- `frontend/`: Next.js App Router app deployed to Vercel
- `backend/`: Express + WebSocket + worker codebase deployed to Render
- optional `shared/`: common types/constants used by both apps

Phase 1 is a demo-first, end-to-end distributed job orchestration system with:

- batch creation
- Redis-backed queue processing
- Lua-backed atomic queue transitions
- exponential retry backoff
- live logs over WebSocket
- polling-based dashboard metrics
- paginated historical logs
- targeted tests for critical flows

Phase 1 prioritizes clarity of system behavior and demonstrability over full production-grade guarantees.

## Implementation Changes

### 1. Repository and runtime structure

Use one repo with these top-level folders:

- `frontend/`: UI, local `clientId`, polling, live log subscription, charts
- `backend/`: API server, WebSocket server, Redis queue logic, worker runtime, DB access
- `shared/`: status enums, API response types, event payload types if useful

Backend remains a modular monolith codebase but runs as separate processes:

- API process: serves REST + WebSocket
- Worker process: consumes jobs and handles retries

Deployment shape:

- Vercel deploys `frontend/`
- Render service 1 deploys backend API/WebSocket server
- Render service 2 deploys backend worker service
- Worker service starts multiple processing loops controlled by `WORKER_CONCURRENCY`

### 2. Data model and persistence

Use PostgreSQL with these Phase 1 tables:

- `batches`
  - `id`, `client_id`, `name`, `total_jobs`, `status`, `created_at`, `completed_at`
- `jobs`
  - `id`, `batch_id`, `status`, `retry_count`, `max_retries`, `created_at`, `updated_at`
- `logs`
  - `id`, `job_id`, `message`, `level`, `event_type`, `created_at`

Phase 1 statuses stored in DB as uppercase enums:

- batch: `RUNNING`, `COMPLETED`
- job: `QUEUED`, `PROCESSING`, `SUCCESS`, `FAILED`
- log event: `STARTED`, `SUCCESS`, `FAILURE`, `RETRY`

API responses should use one consistent convention everywhere:

- keep DB/internal enums uppercase
- return lowercase aggregate keys like `success`, `failed`, `processing` only for stats payloads
- return raw status fields consistently as uppercase unless deliberately transformed everywhere

Add indexes at minimum for:

- `batches.client_id`
- `jobs.batch_id`
- `jobs.batch_id + status`
- `logs.job_id`
- `logs.created_at`

Batch completion must be determined using an aggregated DB query:

- count jobs where status is in `SUCCESS`, `FAILED`
- if that count equals `total_jobs`, mark the batch `COMPLETED`

Do not fetch all jobs into application memory for completion checks.

### 3. Queue, Lua, retry, and worker design

Use this Redis shape:

- main ready queue: `LIST`
- delayed retry queue: `ZSET`

Redis job payload structure:

```json
{
  "jobId": "uuid",
  "batchId": "uuid",
  "retryCount": 0
}
```

Main queue behavior:

- enqueue new jobs with `LPUSH`
- consume with blocking pop on worker loops

Retry behavior:

- on job failure, if retries remain:
  - compute next retry time using exponential backoff
  - push to retry `ZSET` with score = retry timestamp
- scheduler loop runs every 1 second:
  - finds ready retry jobs with score `<= now`
  - moves them back to main queue
  - removes them from retry `ZSET`

Retry delay formula:

- `retryDelay = baseDelay * (2 ^ retryCount)`
- recommended `baseDelay = 2 seconds`

Example:
- Retry 1 -> 2s
- Retry 2 -> 4s
- Retry 3 -> 8s

Use Lua for atomic operations where race conditions matter:

- retry reschedule: add failed job to retry `ZSET` atomically with queue-state cleanup if needed
- retry promotion: move eligible jobs from retry `ZSET` back to ready `LIST` atomically
- optional claim/transition helper scripts if Redis state needs stronger coordination than raw `BRPOP`

Worker processing logic per loop:

1. block on ready queue
2. parse payload
3. update DB job status to `PROCESSING`
4. insert `STARTED` log
5. simulate execution delay between `200ms` and `1500ms`
6. simulate failure with internal constant, e.g. `FAILURE_RATE = 0.3`
7. on success:
   - update job to `SUCCESS`
   - insert `SUCCESS` log
8. on failure:
   - increment retry count
   - if retry count is still within max:
     - schedule retry in `ZSET`
     - insert `RETRY` log
   - otherwise:
     - update job to `FAILED`
     - insert `FAILURE` log
9. after terminal state, run the batch completion aggregate query

Worker safety requirements:

- each worker loop must catch and handle errors internally
- a single job failure must not crash the loop
- unexpected DB/Redis/processing errors should be logged and the loop should continue

Phase 1 worker constraints:

- no in-memory coordination across loops
- Redis + DB are the source of truth
- worker crash recovery is out of scope
- no dead-letter queue yet

### 4. API and realtime contracts

REST API for Phase 1:

- `POST /batches`
  - body: `name`, `totalJobs`, `maxRetries`
  - reads `x-client-id`
  - validates `totalJobs <= 500`
  - creates batch and all jobs
  - enqueues all jobs using the defined Redis payload shape
- `GET /batches`
  - returns batches for `x-client-id`
- `GET /batches/:batchId`
  - returns batch detail if owned by `x-client-id`
- `GET /batches/:batchId/jobs`
  - returns jobs for that batch
- `GET /batches/:batchId/logs?page=1&limit=50`
  - newest first
  - paginated
  - only for owned batch
- `GET /batches/:batchId/stats`
  - returns `total`, `success`, `failed`, `processing`
- `GET /batches/:batchId/throughput`
  - returns completed jobs per time bucket
- `GET /batches/:batchId/retries`
  - returns retry count distribution for charting
- `GET /health`
  - simple health endpoint for deployment/debugging

Validation defaults:

- `totalJobs`: integer, min 1, max 500
- `maxRetries`: integer, bounded, such as 0 to 5
- batch `name`: required, trimmed, bounded length

Throughput definition:

- throughput represents number of completed jobs per time bucket
- use a simple bucket size such as 1 second or 5 seconds in Phase 1
- implement using grouped terminal job updates or grouped completion logs
- response should be chart-friendly for the dashboard

WebSocket stack:

- use native `ws`

Live-log model:

- client opens socket from dashboard page
- client subscribes to a specific `batchId`
- backend emits only logs for subscribed batch clients
- frontend prepends new logs to the feed
- completed batches do not keep live subscription active

Phase 1 WebSocket emission clarification:

- worker can directly emit logs via a shared WebSocket instance or API layer for simplicity
- strict decoupling through Redis pub/sub or another relay is deferred to later phases
- do not over-engineer the worker-to-WebSocket boundary in Phase 1

WebSocket event contract should include:

- `batchId`
- `jobId`
- `message`
- `level`
- `eventType`
- `timestamp`

### 5. Frontend behavior

Batch list screen:

- fetch batches for current `clientId`
- show name, status, total jobs, created time
- create-batch button
- link to dashboard

Create-batch flow:

- form fields: `name`, `totalJobs`, `maxRetries`
- frontend validation aligned with backend
- optimistic UX optional, but not required
- on success, navigate to dashboard

Dashboard screen:

- header with batch name and status
- progress bar using `(success + failed) / total`
- stats cards for total, success, failed, processing
- charts using shadcn charts for:
  - status distribution
  - throughput over time
  - retry distribution
- live logs panel:
  - running batch: initial paginated fetch + WebSocket prepend + load older logs on demand
  - completed batch: paginated fetch only, no WebSocket

Polling model:

- for running batches, poll stats and dashboard analytics every 2 to 5 seconds
- for completed batches, stop polling and show static snapshot

### 6. Testing and acceptance criteria

Targeted automated tests should cover:

- batch creation creates DB records and enqueues correct number of jobs
- enqueued Redis payload contains `jobId`, `batchId`, and `retryCount`
- `x-client-id` ownership filtering works for list/detail/log routes
- job success path updates status and creates `STARTED` and `SUCCESS` logs
- job failure with retries creates `RETRY` log and schedules delayed retry with correct exponential delay
- final failure after max retries creates `FAILURE` log and terminal state
- delayed retry promotion moves eligible jobs back to ready queue
- batch completion flips to `COMPLETED` only when aggregate completed count equals `total_jobs`
- stats endpoint returns correct counts with consistent status mapping
- logs endpoint paginates newest-first correctly
- throughput endpoint returns completed jobs grouped by time bucket
- WebSocket subscription receives only logs for subscribed `batchId`
- worker loop survives individual job-processing errors and keeps consuming new work

Manual demo scenarios:

- create a 20-job batch and watch progress update live
- observe mixed success/failure with retries
- refresh dashboard during a running batch and recover state from API
- open a completed batch and verify it behaves as historical snapshot
- run worker service with concurrency greater than 1 and verify multiple jobs process in parallel

## Important Public Interfaces

Phase 1 public interfaces that must be treated as intentional:

- HTTP header: `x-client-id`
- Redis job payload:
  - `jobId`
  - `batchId`
  - `retryCount`
- `POST /batches` request body
- paginated logs route: `GET /batches/:batchId/logs?page=1&limit=50`
- WebSocket subscription by `batchId`
- log event payload shape
- dashboard stats payload:
  - `total`
  - `success`
  - `failed`
  - `processing`

## Assumptions and Defaults

- Phase 1 remains no-auth and uses browser-generated anonymous identity
- queue design is `LIST` for ready jobs plus `ZSET` for delayed retries
- retry strategy is exponential backoff with `baseDelay = 2 seconds`
- job simulation stays intentionally probabilistic and non-deterministic
- failure rate is an internal constant, not user-configurable
- max jobs per batch is `500`
- worker deployment is one Render worker service with configurable internal concurrency
- WebSocket implementation uses native `ws`
- charts use shadcn chart components
- logs are paginated and retained without retention caps in Phase 1
- worker crash recovery, dead-letter queues, and advanced scheduling are deferred to later phases
