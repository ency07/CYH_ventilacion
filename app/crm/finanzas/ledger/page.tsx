import React from "react";
import { getLedgerAction } from "@/lib/server-actions/crm-financials";
import LedgerClient from "./LedgerClient";

export const dynamic = "force-dynamic";

export default async function LedgerPage() {
  const res = await getLedgerAction();
  const ledgerEntries = res.success ? res.data : [];

  return <LedgerClient initialData={ledgerEntries} />;
}
