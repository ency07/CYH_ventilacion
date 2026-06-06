import React from "react";
import { db } from "@/lib/db";
import { crmTasks, leads, crmCompanies } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import ActividadesClient from "./ActividadesClient";

export const dynamic = "force-dynamic";

export default async function ActividadesPage() {
  const allTasks = await db.select({
    task: crmTasks,
    lead: { id: leads.id },
    companyName: crmCompanies.name,
  })
  .from(crmTasks)
  .leftJoin(leads, eq(crmTasks.leadId, leads.id))
  .leftJoin(crmCompanies, eq(leads.companyId, crmCompanies.id))
  .orderBy(desc(crmTasks.dueDate));

  return (
    <div className="h-[calc(100vh-4rem)] w-full">
      <ActividadesClient activitiesData={allTasks} />
    </div>
  );
}
