"use client";

import { Pie, PieChart, Cell, Line, LineChart as ReLineChart, CartesianGrid, XAxis, YAxis, Bar, BarChart as ReBarChart } from "recharts";

import type { BatchStats } from "@batchflow/shared";

import type { DashboardSeriesPoint, ThroughputPoint } from "../lib/mock-data";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "./ui/chart";

const distributionConfig = {
  success: { label: "Success", color: "var(--chart-1)" },
  failed: { label: "Failed", color: "var(--chart-2)" },
  processing: { label: "Processing", color: "var(--chart-3)" },
};

const throughputConfig = {
  completed: { label: "Completed Jobs", color: "var(--chart-4)" },
};

const statusSeriesConfig = {
  success: { label: "Success", color: "var(--chart-1)" },
  failed: { label: "Failed", color: "var(--chart-2)" },
  processing: { label: "Processing", color: "var(--chart-3)" },
};

function axisProps() {
  return {
    axisLine: false,
    tickLine: false,
    tick: { fill: "oklch(0.48 0.016 250)", fontSize: 12 },
  };
}

export function DistributionChart({ stats }: { stats: BatchStats }) {
  const data = [
    { key: "success", value: stats.success },
    { key: "failed", value: stats.failed },
    { key: "processing", value: stats.processing },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_11rem] md:items-center">
      <ChartContainer config={distributionConfig} className="mx-auto h-[280px]">
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent formatter={(value: any) => `${value} jobs`} hideLabel />}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="key"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={3}
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
            ))}
          </Pie>
          <ChartLegend
            verticalAlign="bottom"
            content={<ChartLegendContent />}
          />
        </PieChart>
      </ChartContainer>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: `var(--color-${item.key})` }}
              />
              <span className="font-medium text-ink">
                {distributionConfig[item.key as keyof typeof distributionConfig].label}
              </span>
            </div>
            <span className="text-inkSoft">{item.value} jobs</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ThroughputChart({ data }: { data: ThroughputPoint[] }) {
  return (
    <ChartContainer config={throughputConfig} className="h-[250px]">
      <ReLineChart data={data} accessibilityLayer margin={{ left: 4, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} stroke="oklch(0.92 0.01 80)" />
        <XAxis dataKey="label" {...axisProps()} />
        <YAxis {...axisProps()} width={30} />
        <ChartTooltip
          cursor={{ stroke: "oklch(0.89 0.012 85)", strokeDasharray: "4 4" }}
          content={<ChartTooltipContent formatter={(value: any) => `${value} completed`} />}
        />
        <Line
          type="monotone"
          dataKey="completed"
          stroke="var(--color-completed)"
          strokeWidth={3}
          dot={{ r: 4, fill: "var(--color-completed)" }}
          activeDot={{ r: 6 }}
        />
      </ReLineChart>
    </ChartContainer>
  );
}

export function StatusOverTimeChart({
  data,
}: {
  data: DashboardSeriesPoint[];
}) {
  return (
    <ChartContainer config={statusSeriesConfig} className="h-[250px]">
      <ReBarChart data={data} accessibilityLayer margin={{ left: 4, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} stroke="oklch(0.92 0.01 80)" />
        <XAxis dataKey="label" {...axisProps()} />
        <YAxis {...axisProps()} width={30} />
        <ChartTooltip
          cursor={{ fill: "oklch(0.96 0.008 95 / 0.65)" }}
          content={<ChartTooltipContent indicator="line" />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="success" fill="var(--color-success)" radius={[8, 8, 0, 0]} />
        <Bar dataKey="failed" fill="var(--color-failed)" radius={[8, 8, 0, 0]} />
        <Bar dataKey="processing" fill="var(--color-processing)" radius={[8, 8, 0, 0]} />
      </ReBarChart>
    </ChartContainer>
  );
}
