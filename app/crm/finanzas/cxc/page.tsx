import React from "react";
import { getAccountsReceivableAction } from "@/lib/server-actions/crm-financials";
import CxCClient from "./CxCClient";

export const dynamic = "force-dynamic";

export default async function CxCPage() {
  const res = await getAccountsReceivableAction();
  const cxcData = res.success ? res.data : [];

  return <CxCClient initialData={cxcData} />;
}
