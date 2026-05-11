"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BATCH_STATUS } from "@batchflow/shared";

import { batchApi, type DashboardSeriesPoint, type ThroughputPoint } from "../lib/api";
import {
  AppShell,
  LogsList,
  MetricCard,
  Panel,
  ProgressBar,
  StatusBadge,
} from "./ui";
import {
  DistributionChart,
  StatusOverTimeChart,
  ThroughputChart,
} from "./dashboard-charts";

type DashboardData = {
  batch: Awaited<ReturnType<typeof batchApi.detail>>["batch"];
  stats: Awaited<ReturnType<typeof batchApi.stats>>;
  logs: Awaited<ReturnType<typeof batchApi.logs>>["items"];
  throughput: ThroughputPoint[];
  statusSeries: DashboardSeriesPoint[];
};

export function BatchDashboardClient({ batchId }: { batchId: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let interval: number | undefined;

    const load = async () => {
      try {
        const [detail, stats, logs, throughput, statusSeries] = await Promise.all([
          batchApi.detail(batchId),
          batchApi.stats(batchId),
          batchApi.logs(batchId),
          batchApi.throughput(batchId),
          batchApi.statusSeries(batchId),
        ]);

        if (!mounted) {
          return;
        }

        const nextData: DashboardData = {
          batch: detail.batch,
          stats,
          logs: logs.items,
          throughput: throughput.items,
          statusSeries: statusSeries.items,
        };

        setData(nextData);
        setError(null);

        if (nextData.batch.status === BATCH_STATUS.RUNNING && interval === undefined) {
          interval = window.setInterval(() => {
            void load();
          }, 2500);
        } else if (nextData.batch.status === BATCH_STATUS.COMPLETED && interval !== undefined) {
          window.clearInterval(interval);
          interval = undefined;
        }
      } catch (nextError) {
        if (mounted) {
          setError(nextError instanceof Error ? nextError.message : "Failed to load batch");
        }
      }
    };

    void load();

    return () => {
      mounted = false;
      if (interval !== undefined) {
        window.clearInterval(interval);
      }
    };
  }, [batchId]);

  if (error) {
    return (
      <AppShell eyebrow="Batch dashboard" title="Batch unavailable">
        <p className="text-danger-700">{error}</p>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell eyebrow="Batch dashboard" title="Loading batch">
        <p className="text-inkSoft">Loading dashboard...</p>
      </AppShell>
    );
  }

  const isLive = data.batch.status === BATCH_STATUS.RUNNING;
  const completed = data.stats.success + data.stats.failed;
  const successPct = ((data.stats.success / data.stats.total) * 100).toFixed(1);
  const failedPct = ((data.stats.failed / data.stats.total) * 100).toFixed(1);
  const processingPct = ((data.stats.processing / data.stats.total) * 100).toFixed(1);

  return (
    <AppShell
      eyebrow="Batch dashboard"
      title={data.batch.name}
      action={
        <div className="flex items-center gap-3">
          <StatusBadge status={isLive ? "PROCESSING" : "COMPLETED"} />
          <Link
            href="/batches"
            className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-ink transition hover:border-brand-300 hover:text-brand-700"
          >
            Back to Batches
          </Link>
        </div>
      }
    >
      <div className="space-y-8">
        <div className="grid gap-6 lg:grid-cols-[1.8fr_0.9fr]">
          <div className="space-y-6">
            <ProgressBar stats={data.stats} />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Total" value={data.stats.total.toLocaleString()} helper="Jobs scheduled in this batch." />
              <MetricCard label="Success" value={data.stats.success.toLocaleString()} helper={`${successPct}% of total jobs.`} tone="success" />
              <MetricCard label="Failed" value={data.stats.failed.toLocaleString()} helper={`${failedPct}% of total jobs.`} tone="danger" />
              <MetricCard label="Processing" value={data.stats.processing.toLocaleString()} helper={`${processingPct}% still active.`} tone="warning" />
            </div>
          </div>
          <div className="rounded-[26px] border border-border/80 bg-surface p-5 shadow-panel">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-inkSoft">Dashboard Mode</p>
            <p className="mt-3 text-2xl font-semibold text-ink">{isLive ? "Live monitoring" : "Historical snapshot"}</p>
            <p className="mt-3 text-sm leading-7 text-inkSoft">
              {isLive
                ? `This batch is still running. The dashboard is polling for fresh stats and logs while the worker processes jobs in the background. ${completed} jobs are already done.`
                : "This batch is complete. Polling stops and the page behaves like a historical snapshot with static logs and analytics."}
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr_1.2fr_1.1fr]">
          <Panel title="Job Status Distribution" caption="Share of successful, failed, and still-running jobs.">
            <DistributionChart stats={data.stats} />
          </Panel>
          <Panel title="Jobs Over Time" caption="Completed jobs per time bucket for trend inspection.">
            <ThroughputChart data={data.throughput} />
          </Panel>
          <Panel title="Jobs by Status Over Time" caption="Success, failure, and in-flight counts by time window.">
            <StatusOverTimeChart data={data.statusSeries} />
          </Panel>
          <Panel title="Logs Feed" caption={isLive ? "Newest-first stream for the active batch." : "Historical log history for the completed batch."}>
            <LogsList logs={data.logs} isLive={isLive} />
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
