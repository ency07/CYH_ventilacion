import React from "react";
import { getProductionOrdersAction } from "@/lib/server-actions/crm-production";
import ProduccionClient from "./ProduccionClient";

export const dynamic = "force-dynamic";

export default async function ProduccionPage() {
  const res = await getProductionOrdersAction();
  const orders = res.success ? res.data : [];

  return <ProduccionClient initialOrders={orders} />;
}
