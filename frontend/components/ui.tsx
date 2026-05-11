import Link from "next/link";
import type { ReactNode } from "react";

import { BATCH_STATUS, JOB_STATUS, type BatchStats, type LogRecord } from "@batchflow/shared";

const statusStyles: Record<string, string> = {
  [BATCH_STATUS.COMPLETED]:
    "border-success-500/25 bg-success-50 text-success-700",
  [BATCH_STATUS.RUNNING]: "border-brand-500/25 bg-brand-50 text-brand-700",
  [JOB_STATUS.PROCESSING]:
    "border-warning-500/25 bg-warning-50 text-warning-700",
  [JOB_STATUS.FAILED]: "border-danger-500/25 bg-danger-50 text-danger-700",
  [JOB_STATUS.SUCCESS]: "border-success-500/25 bg-success-50 text-success-700",
};

export function AppShell({
  title,
  eyebrow,
  action,
  children,
}: {
  title: string;
  eyebrow: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[32px] border border-border/80 bg-surface/95 shadow-panel backdrop-blur">
          <div className="flex flex-col gap-5 border-b border-border/70 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-inkSoft">
                {eyebrow}
              </p>
              <h1 className="mt-2 font-display text-4xl tracking-tight text-ink md:text-5xl">
                {title}
              </h1>
            </div>
            {action}
          </div>
          <div className="px-4 py-5 md:px-8 md:py-8">{children}</div>
        </section>
      </div>
    </main>
  );
}

export function ActionButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl border border-brand-300 bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
    >
      {children}
    </Link>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
        statusStyles[status] ?? "border-border bg-surfaceMuted text-inkSoft"
      }`}
    >
      {status.toLowerCase()}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  helper,
  tone = "neutral",
}: {
  label: string;
  value: string;
  helper: string;
  tone?: "neutral" | "success" | "danger" | "warning";
}) {
  const toneMap = {
    neutral: "bg-surface text-ink",
    success: "bg-success-50/80 text-success-700",
    danger: "bg-danger-50/80 text-danger-700",
    warning: "bg-warning-50/80 text-warning-700",
  };

  return (
    <article className={`rounded-[24px] border border-border/80 p-5 shadow-panel ${toneMap[tone]}`}>
      <p className="text-sm font-medium text-inkSoft">{label}</p>
      <p className="mt-4 text-4xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-sm text-inkSoft">{helper}</p>
    </article>
  );
}

export function Panel({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[26px] border border-border/80 bg-surface p-5 shadow-panel">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {caption ? <p className="mt-1 text-sm text-inkSoft">{caption}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function ProgressBar({ stats }: { stats: BatchStats }) {
  const completed = stats.success + stats.failed;
  const percentage = Math.round((completed / stats.total) * 100);

  return (
    <div className="rounded-[24px] border border-border/80 bg-surfaceMuted/70 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-inkSoft">
            Overall Progress
          </p>
          <p className="mt-1 text-sm text-inkSoft">
            {completed} of {stats.total} jobs have reached a terminal state.
          </p>
        </div>
        <p className="text-lg font-semibold text-ink">
          {percentage}% <span className="text-sm text-inkSoft">({completed} / {stats.total})</span>
        </p>
      </div>
      <div className="mt-4 h-3 rounded-full bg-brand-100">
        <div
          className="h-3 rounded-full bg-brand-500 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function LogsList({
  logs,
  isLive,
}: {
  logs: LogRecord[];
  isLive: boolean;
}) {
  return (
    <div className="rounded-[20px] border border-border/70 bg-canvas/70">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-ink">Live Logs</p>
          <p className="text-xs text-inkSoft">
            {isLive
              ? "Streaming updates while the batch is running."
              : "Historical snapshot. Streaming stops after completion."}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
            isLive ? "bg-brand-100 text-brand-700" : "bg-surfaceMuted text-inkSoft"
          }`}
        >
          {isLive ? "live" : "static"}
        </span>
      </div>
      <div className="max-h-[27rem] space-y-3 overflow-y-auto px-4 py-4">
        {logs.map((entry) => (
          <div key={entry.id} className="grid grid-cols-[5.5rem_1fr] gap-3 text-sm">
            <span className="font-medium text-inkSoft">
              {new Date(entry.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
            <p className="text-ink">
              <span className="font-semibold">{entry.eventType}</span> {entry.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
