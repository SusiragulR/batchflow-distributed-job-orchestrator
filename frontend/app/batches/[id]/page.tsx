import { BatchDashboardClient } from "../../../components/batch-dashboard-client";

export default async function BatchDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BatchDashboardClient batchId={id} />;
}
