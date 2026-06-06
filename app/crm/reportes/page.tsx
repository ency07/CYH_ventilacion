import React from "react";
import ReportesClient from "./ReportesClient";
import { getReportsMetricsAction } from "@/lib/server-actions/crm";

export const dynamic = "force-dynamic";

export default async function ReportesPage() {
  const res = await getReportsMetricsAction();
  const metrics = res.success ? res.data : null;

  return (
    <div className="h-[calc(100vh-4rem)] w-full">
      <ReportesClient initialData={metrics} />
    </div>
  );
}
