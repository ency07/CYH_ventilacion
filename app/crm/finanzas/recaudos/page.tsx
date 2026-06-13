import React from "react";
import { getRecaudosAction } from "@/lib/server-actions/crm-financials";
import RecaudosClient from "./RecaudosClient";

export const dynamic = "force-dynamic";

export default async function RecaudosPage() {
  const res = await getRecaudosAction();
  const collectionsData = res.success ? res.data : [];

  return <RecaudosClient initialData={collectionsData} />;
}
