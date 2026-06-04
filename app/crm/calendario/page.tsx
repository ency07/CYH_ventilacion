import React from "react";
import { db } from "@/lib/db";
import { crmTasks, leads, crmCompanies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import CalendarClient from "./CalendarClient";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
  const allTasks = await db.select({
    id: crmTasks.id,
    leadId: crmTasks.leadId,
    taskType: crmTasks.taskType,
    status: crmTasks.status,
    dueDate: crmTasks.dueDate,
    assignedTo: crmTasks.assignedTo,
    notes: crmTasks.notes,
    companyName: crmCompanies.name,
    leadName: leads.fullName,
  })
  .from(crmTasks)
  .leftJoin(leads, eq(crmTasks.leadId, leads.id))
  .leftJoin(crmCompanies, eq(leads.companyId, crmCompanies.id));

  return <CalendarClient tasks={allTasks} />;
}
