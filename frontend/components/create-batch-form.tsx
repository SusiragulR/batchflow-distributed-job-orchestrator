"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { batchApi } from "../lib/api";
import { AppShell } from "./ui";

export function CreateBatchForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [totalJobs, setTotalJobs] = useState(100);
  const [maxRetries, setMaxRetries] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await batchApi.create({ name, totalJobs, maxRetries });
      router.push(`/batches/${response.batch.id}`);
      router.refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to create batch");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell eyebrow="Batch creation" title="Create Batch">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[28px] border border-border/80 bg-surface p-6 shadow-panel">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-inkSoft">
            New workload
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">
            Launch a new batch run.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-inkSoft">
            This form now posts to the backend API and creates a live batch. Once
            submitted, the worker can begin processing jobs and the dashboard will
            update as the run progresses.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-ink">Batch Name</span>
              <input
                className="mt-2 w-full rounded-2xl border border-border bg-canvas px-4 py-3 text-ink outline-none ring-0 transition focus:border-brand-400"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Order Processing - May 15"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink">Total Jobs</span>
              <input
                type="number"
                min={1}
                max={500}
                className="mt-2 w-full rounded-2xl border border-border bg-canvas px-4 py-3 text-ink outline-none transition focus:border-brand-400"
                value={totalJobs}
                onChange={(event) => setTotalJobs(Number(event.target.value))}
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink">Max Retries</span>
              <input
                type="number"
                min={0}
                max={3}
                className="mt-2 w-full rounded-2xl border border-border bg-canvas px-4 py-3 text-ink outline-none transition focus:border-brand-400"
                value={maxRetries}
                onChange={(event) => setMaxRetries(Number(event.target.value))}
                required
              />
            </label>

            {error ? <p className="text-sm text-danger-700">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex rounded-2xl border border-brand-300 bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Creating..." : "Create Batch"}
            </button>
          </form>
        </section>

        <section className="rounded-[28px] border border-border/80 bg-surfaceMuted/70 p-6 shadow-panel">
          <h3 className="text-lg font-semibold text-ink">Rules</h3>
          <ul className="mt-4 space-y-3 text-sm text-inkSoft">
            <li>Batch names are required and trimmed.</li>
            <li>Total jobs are capped at 500 for demo safety.</li>
            <li>Retries are capped at 3 with exponential backoff.</li>
            <li>Ownership is attached automatically via browser `clientId`.</li>
          </ul>
        </section>
      </div>
    </AppShell>
  );
}

