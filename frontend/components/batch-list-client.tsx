"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BATCH_STATUS, JOB_STATUS, type BatchRecord } from "@batchflow/shared";

import { batchApi } from "../lib/api";
import { AppShell, ActionButton, StatusBadge } from "./ui";

const formatDate = (value: string) =>
  new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getDisplayStatus = (batch: BatchRecord) =>
  batch.status === BATCH_STATUS.RUNNING ? JOB_STATUS.PROCESSING : batch.status;

export function BatchListClient() {
  const [items, setItems] = useState<BatchRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const response = await batchApi.list();
        if (mounted) {
          setItems(response.items);
          setError(null);
        }
      } catch (nextError) {
        if (mounted) {
          setError(nextError instanceof Error ? nextError.message : "Failed to load batches");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const activeCount = items.filter((batch) => batch.status === BATCH_STATUS.RUNNING).length;
  const completedCount = items.filter((batch) => batch.status === BATCH_STATUS.COMPLETED).length;

  return (
    <AppShell
      eyebrow="Batch orchestration"
      title="BatchFlow"
      action={<ActionButton href="/batches/new">Create Batch</ActionButton>}
    >
      <div className="mb-8 grid gap-4 rounded-[28px] border border-border/80 bg-surfaceMuted/70 p-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-inkSoft">
            Mission Control
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-inkSoft">
            This is the landing page for all batches. Users arrive here first to scan
            recently created runs, launch a fresh batch, and jump into the dashboard
            for live or historical analysis.
          </p>
        </div>
        <div className="rounded-[22px] border border-border/70 bg-surface px-5 py-4">
          <p className="text-sm font-medium text-inkSoft">Active batches</p>
          <p className="mt-3 text-3xl font-semibold text-ink">{activeCount}</p>
        </div>
        <div className="rounded-[22px] border border-border/70 bg-surface px-5 py-4">
          <p className="text-sm font-medium text-inkSoft">Completed snapshots</p>
          <p className="mt-3 text-3xl font-semibold text-ink">{completedCount}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-border/80 bg-surface shadow-panel">
        <div className="grid grid-cols-[2fr_1fr_1fr_1.4fr_0.8fr] border-b border-border/70 bg-surfaceMuted/70 px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-inkSoft">
          <span>Batch Name</span>
          <span>Status</span>
          <span>Total Jobs</span>
          <span>Created At</span>
          <span>View</span>
        </div>
        {loading ? (
          <div className="px-6 py-12 text-sm text-inkSoft">Loading batches...</div>
        ) : error ? (
          <div className="px-6 py-12 text-sm text-danger-700">{error}</div>
        ) : items.length === 0 ? (
          <div className="px-6 py-12 text-sm text-inkSoft">
            No batches yet. Create the first batch to start the flow.
          </div>
        ) : (
          <div className="divide-y divide-border/70">
            {items.map((batch) => {
              const displayStatus = getDisplayStatus(batch);
              return (
                <div
                  key={batch.id}
                  className="grid grid-cols-[2fr_1fr_1fr_1.4fr_0.8fr] items-center px-6 py-5 text-sm"
                >
                  <div>
                    <p className="text-base font-semibold text-ink">{batch.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-inkSoft">
                      {displayStatus === JOB_STATUS.PROCESSING
                        ? "Live batch"
                        : "Historical snapshot"}
                    </p>
                  </div>
                  <StatusBadge status={displayStatus} />
                  <span className="text-base font-semibold text-ink">
                    {batch.totalJobs.toLocaleString()}
                  </span>
                  <span className="text-inkSoft">{formatDate(batch.createdAt)}</span>
                  <Link
                    href={`/batches/${batch.id}`}
                    className="inline-flex w-fit items-center justify-center rounded-2xl border border-border bg-canvas px-4 py-2 font-medium text-ink transition hover:border-brand-300 hover:text-brand-700"
                  >
                    View
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

