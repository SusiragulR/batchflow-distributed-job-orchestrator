import { workerServiceRuntime } from "./runtime/worker-service.js";

void workerServiceRuntime.bootstrap({
  source: "dedicated-worker",
});
