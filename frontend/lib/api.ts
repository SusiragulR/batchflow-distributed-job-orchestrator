import type { BatchRecord, BatchStats, JobRecord, LogRecord } from "@batchflow/shared";

import { getClientId } from "./client-id";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

type ApiOptions = RequestInit & {
  query?: Record<string, string | number | undefined>;
};

const buildUrl = (path: string, query?: ApiOptions["query"]) => {
  const url = new URL(path, API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
};

async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const clientId = getClientId();
  const response = await fetch(buildUrl(path, options.query), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-client-id": clientId,
      ...(options.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error ?? "Request failed");
  }

  return response.json() as Promise<T>;
}

export type DashboardSeriesPoint = {
  label: string;
  success: number;
  failed: number;
  processing: number;
};

export type ThroughputPoint = {
  label: string;
  completed: number;
};

export type RetryPoint = {
  retryCount: number;
  jobs: number;
};

export type BatchDetailResponse = {
  batch: BatchRecord;
};

export const batchApi = {
  list: () => apiFetch<{ items: BatchRecord[] }>("batches"),
  create: (input: { name: string; totalJobs: number; maxRetries: number }) =>
    apiFetch<{ batch: BatchRecord }>("batches", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  detail: (batchId: string) => apiFetch<BatchDetailResponse>(`batches/${batchId}`),
  jobs: (batchId: string) => apiFetch<{ items: JobRecord[] }>(`batches/${batchId}/jobs`),
  stats: (batchId: string) => apiFetch<BatchStats>(`batches/${batchId}/stats`),
  logs: (batchId: string, page = 1, limit = 50) =>
    apiFetch<{ items: LogRecord[]; page: number; limit: number }>(
      `batches/${batchId}/logs`,
      { query: { page, limit } },
    ),
  throughput: (batchId: string) =>
    apiFetch<{ items: ThroughputPoint[] }>(`batches/${batchId}/throughput`),
  statusSeries: (batchId: string) =>
    apiFetch<{ items: DashboardSeriesPoint[] }>(`batches/${batchId}/status-series`),
  retries: (batchId: string) =>
    apiFetch<{ items: RetryPoint[] }>(`batches/${batchId}/retries`),
};

