"use client";

import * as React from "react";
import {
  Legend as RechartsLegend,
  type LegendProps,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  type TooltipProps,
} from "recharts";

type ChartConfig = Record<
  string,
  {
    label: string;
    color: string;
  }
>;

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("Chart components must be used inside ChartContainer.");
  }

  return context;
}

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function ChartContainer({
  config,
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement> & {
  config: ChartConfig;
}) {
  const style = Object.fromEntries(
    Object.entries(config).map(([key, value]) => [`--color-${key}`, value.color]),
  ) as React.CSSProperties;

  return (
    <ChartContext.Provider value={{ config }}>
      <div className={cn("h-[250px] w-full", className)} style={style}>
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export const ChartTooltip = RechartsTooltip;
export const ChartLegend = RechartsLegend;

export function ChartTooltipContent({
  active,
  payload,
  label,
  indicator = "dot",
  formatter,
  labelFormatter,
  hideLabel,
}: TooltipProps<any, any> & {
  indicator?: "dot" | "line";
  hideLabel?: boolean;
}) {
  const { config } = useChart();

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="min-w-44 rounded-2xl border border-border/80 bg-surface/95 px-3 py-2 shadow-panel backdrop-blur">
      {!hideLabel ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-inkSoft">
          {labelFormatter ? labelFormatter(label, payload) : label}
        </p>
      ) : null}
      <div className="space-y-1.5">
        {payload.map((entry: any) => {
          const payloadKey =
            entry?.payload?.key ??
            entry?.payload?.name ??
            entry?.name ??
            entry?.dataKey ??
            "";
          const key = String(payloadKey);
          const item = config[key];
          const itemLabel = item?.label ?? String(entry.name ?? key);
          const value = formatter
            ? formatter(entry.value, entry.name, entry, 0, payload)
            : entry.value?.toLocaleString();
          const color = entry.color ?? item?.color ?? "var(--chart-1)";

          return (
            <div key={`${entry.dataKey}-${entry.name}`} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2 text-ink">
                <span
                  className={cn(
                    "shrink-0 rounded-full",
                    indicator === "line" ? "h-0.5 w-3" : "h-2.5 w-2.5",
                  )}
                  style={{ backgroundColor: color }}
                />
                <span>{itemLabel}</span>
              </div>
              <span className="font-semibold text-ink">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ChartLegendContent({
  payload,
}: LegendProps) {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-4 text-xs text-inkSoft">
      {payload.map((entry: any) => {
        const key = String(entry.dataKey ?? entry.value ?? "");
        const item = config[key];
        const label = item?.label ?? String(entry.value ?? key);

        return (
          <div key={key} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color ?? item?.color }}
            />
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
}
