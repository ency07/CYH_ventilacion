import React from "react";
import { getReconciliationAction } from "@/lib/server-actions/crm-financials";
import ConciliacionClient from "./ConciliacionClient";

export const dynamic = "force-dynamic";

export default async function ConciliacionPage() {
  const res = await getReconciliationAction();
  const reconData = res.success ? res.data : { reconciledCount: 0, pendingCount: 0, discrepancyCount: 0, transactions: [] };

  return <ConciliacionClient initialData={reconData} />;
}
