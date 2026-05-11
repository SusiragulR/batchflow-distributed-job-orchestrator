import { BATCH_STATUS, JOB_STATUS, type BatchRecord, type BatchStats, type LogRecord } from "@batchflow/shared";

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

export type DashboardDetail = {
  batch: BatchRecord;
  stats: BatchStats;
  logs: LogRecord[];
  throughput: ThroughputPoint[];
  statusSeries: DashboardSeriesPoint[];
};

const baseCreatedAt = [
  "2025-05-15T10:30:00.000Z",
  "2025-05-15T09:15:00.000Z",
  "2025-05-14T18:45:00.000Z",
  "2025-05-14T14:20:00.000Z",
  "2025-05-13T11:05:00.000Z",
];

export const mockBatches: BatchRecord[] = [
  {
    id: "user-import-may-15",
    clientId: "demo-client",
    name: "User Import - May 15",
    totalJobs: 1250,
    status: BATCH_STATUS.COMPLETED,
    createdAt: baseCreatedAt[0],
    completedAt: "2025-05-15T11:08:00.000Z",
  },
  {
    id: "order-processing-may-15",
    clientId: "demo-client",
    name: "Order Processing - May 15",
    totalJobs: 980,
    status: BATCH_STATUS.RUNNING,
    createdAt: baseCreatedAt[1],
    completedAt: null,
  },
  {
    id: "report-generation-may-14",
    clientId: "demo-client",
    name: "Report Generation - May 14",
    totalJobs: 560,
    status: BATCH_STATUS.COMPLETED,
    createdAt: baseCreatedAt[2],
    completedAt: "2025-05-14T19:12:00.000Z",
  },
  {
    id: "inventory-sync-may-14",
    clientId: "demo-client",
    name: "Inventory Sync - May 14",
    totalJobs: 320,
    status: BATCH_STATUS.RUNNING,
    createdAt: baseCreatedAt[3],
    completedAt: null,
  },
  {
    id: "customer-upload-may-13",
    clientId: "demo-client",
    name: "Customer Upload - May 13",
    totalJobs: 1100,
    status: BATCH_STATUS.COMPLETED,
    createdAt: baseCreatedAt[4],
    completedAt: "2025-05-13T12:40:00.000Z",
  },
];

const log = (
  id: string,
  jobId: string,
  batchId: string,
  message: string,
  eventType: LogRecord["eventType"],
  level: LogRecord["level"],
  createdAt: string,
): LogRecord => ({
  id,
  jobId,
  batchId,
  message,
  eventType,
  level,
  createdAt,
});

export const mockDashboardDetails: Record<string, DashboardDetail> = {
  "order-processing-may-15": {
    batch: mockBatches[1],
    stats: {
      total: 980,
      success: 620,
      failed: 45,
      processing: 315,
    },
    logs: [
      log("1", "637", "order-processing-may-15", "Job 637 processed successfully", "SUCCESS", "INFO", "2025-05-15T10:32:15.000Z"),
      log("2", "636", "order-processing-may-15", "Job 636 processed successfully", "SUCCESS", "INFO", "2025-05-15T10:32:12.000Z"),
      log("3", "635", "order-processing-may-15", "Job 635 is being processed", "STARTED", "INFO", "2025-05-15T10:32:10.000Z"),
      log("4", "634", "order-processing-may-15", "Job 634 processed successfully", "SUCCESS", "INFO", "2025-05-15T10:32:09.000Z"),
      log("5", "633", "order-processing-may-15", "Job 633 failed (Timeout)", "FAILURE", "ERROR", "2025-05-15T10:32:07.000Z"),
      log("6", "632", "order-processing-may-15", "Job 632 processed successfully", "SUCCESS", "INFO", "2025-05-15T10:32:05.000Z"),
      log("7", "631", "order-processing-may-15", "Job 631 is being processed", "STARTED", "INFO", "2025-05-15T10:32:03.000Z"),
      log("8", "630", "order-processing-may-15", "Job 630 processed successfully", "SUCCESS", "INFO", "2025-05-15T10:32:01.000Z"),
      log("9", "629", "order-processing-may-15", "Job 629 is being processed", "STARTED", "INFO", "2025-05-15T10:31:59.000Z"),
      log("10", "628", "order-processing-may-15", "Job 628 processed successfully", "SUCCESS", "INFO", "2025-05-15T10:31:57.000Z"),
    ],
    throughput: [
      { label: "12 AM", completed: 150 },
      { label: "3 AM", completed: 365 },
      { label: "6 AM", completed: 590 },
      { label: "12 PM", completed: 735 },
      { label: "6 PM", completed: 980 },
    ],
    statusSeries: [
      { label: "12 AM", success: 180, failed: 20, processing: 440 },
      { label: "6 AM", success: 450, failed: 55, processing: 270 },
      { label: "12 PM", success: 710, failed: 95, processing: 155 },
      { label: "6 PM", success: 840, failed: 110, processing: 30 },
    ],
  },
  "user-import-may-15": {
    batch: mockBatches[0],
    stats: {
      total: 1250,
      success: 1184,
      failed: 66,
      processing: 0,
    },
    logs: [
      log("11", "1250", "user-import-may-15", "Batch completed and archived", "SUCCESS", "INFO", "2025-05-15T11:08:00.000Z"),
      log("12", "1249", "user-import-may-15", "Job 1249 processed successfully", "SUCCESS", "INFO", "2025-05-15T11:07:51.000Z"),
      log("13", "1248", "user-import-may-15", "Job 1248 processed successfully", "SUCCESS", "INFO", "2025-05-15T11:07:47.000Z"),
      log("14", "1247", "user-import-may-15", "Job 1247 failed after max retries", "FAILURE", "ERROR", "2025-05-15T11:07:41.000Z"),
      log("15", "1246", "user-import-may-15", "Job 1246 processed successfully", "SUCCESS", "INFO", "2025-05-15T11:07:34.000Z"),
    ],
    throughput: [
      { label: "12 AM", completed: 240 },
      { label: "3 AM", completed: 515 },
      { label: "6 AM", completed: 790 },
      { label: "9 AM", completed: 1040 },
      { label: "11 AM", completed: 1250 },
    ],
    statusSeries: [
      { label: "12 AM", success: 300, failed: 15, processing: 650 },
      { label: "6 AM", success: 725, failed: 35, processing: 320 },
      { label: "9 AM", success: 1015, failed: 52, processing: 95 },
      { label: "11 AM", success: 1184, failed: 66, processing: 0 },
    ],
  },
};

export const findBatchById = (id: string) =>
  mockDashboardDetails[id] ?? null;

export const batchListView = mockBatches.map((batch) => {
  const stats = mockDashboardDetails[batch.id]?.stats;
  const processingStatus =
    batch.status === BATCH_STATUS.RUNNING && (stats?.processing ?? 0) > 0
      ? JOB_STATUS.PROCESSING
      : batch.status;

  return {
    ...batch,
    displayStatus: processingStatus,
  };
});

