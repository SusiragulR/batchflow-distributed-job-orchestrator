CREATE TABLE IF NOT EXISTS batches (
  id UUID PRIMARY KEY,
  client_id TEXT NOT NULL,
  name TEXT NOT NULL,
  total_jobs INT NOT NULL CHECK (total_jobs > 0),
  status TEXT NOT NULL CHECK (status IN ('RUNNING', 'COMPLETED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('QUEUED', 'PROCESSING', 'SUCCESS', 'FAILED')),
  retry_count INT NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
  max_retries INT NOT NULL CHECK (max_retries >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('INFO', 'WARN', 'ERROR')),
  event_type TEXT NOT NULL CHECK (event_type IN ('STARTED', 'SUCCESS', 'FAILURE', 'RETRY')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batches_client_id ON batches(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_batch_id ON jobs(batch_id);
CREATE INDEX IF NOT EXISTS idx_jobs_batch_id_status ON jobs(batch_id, status);
CREATE INDEX IF NOT EXISTS idx_logs_job_id ON logs(job_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC);

