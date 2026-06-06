import React from "react";
import { db } from "@/lib/db";
import { crmTasks, leads } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import TareasClient from "./TareasClient";

export const dynamic = "force-dynamic";

export default async function TareasPage() {
  const allTasks = await db.select({
    task: crmTasks,
    leadName: leads.fullName,
    companyName: leads.companyName,
    city: leads.city
  })
  .from(crmTasks)
  .leftJoin(leads, eq(crmTasks.leadId, leads.id))
  .orderBy(desc(crmTasks.dueDate));

  return (
    <div className="h-[calc(100vh-4rem)] w-full bg-bg-secondary">
      <TareasClient tasksData={allTasks} />
    </div>
  );
}
