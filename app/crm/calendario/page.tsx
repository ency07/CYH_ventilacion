import React from "react";
import { db } from "@/lib/db";
import { crmTasks, leads, crmCompanies, crmUsers, crmCustomers, crmPipeline } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import CalendarClient from "./CalendarClient";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
  const supabase = getSupabaseServer();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) {
    redirect("/login");
  }

  // Fetch current user details from DB
  const [dbUser] = await db.select().from(crmUsers).where(eq(crmUsers.id, authData.user.id));
  if (!dbUser) {
    redirect("/login");
  }

  const currentUser = {
    id: dbUser.id,
    name: dbUser.fullName || authData.user.email?.split("@")[0] || "Usuario",
    role: dbUser.role,
    email: dbUser.email
  };

  // Base query with relations
  const query = db.select({
    id: crmTasks.id,
    leadId: crmTasks.leadId,
    taskType: crmTasks.taskType,
    status: crmTasks.status,
    dueDate: crmTasks.dueDate,
    assignedTo: crmTasks.assignedTo,
    notes: crmTasks.notes,
    priority: crmTasks.priority,
    companyName: crmCompanies.name,
    customerName: crmCustomers.name,
    leadName: leads.fullName,
    environmentType: leads.environmentType,
  })
  .from(crmTasks)
  .leftJoin(leads, eq(crmTasks.leadId, leads.id))
  .leftJoin(crmCompanies, eq(leads.companyId, crmCompanies.id))
  .leftJoin(crmCustomers, eq(crmCompanies.name, crmCustomers.name))
  .leftJoin(crmPipeline, eq(leads.id, crmPipeline.leadId));

  let filteredQuery = query;
  if (currentUser.role === "tecnico" || currentUser.role === "ingeniero") {
    filteredQuery = query.where(eq(crmTasks.assignedTo, currentUser.email)) as any;
  } else if (currentUser.role === "comercial" || currentUser.role === "vendedor" || currentUser.role === "asesor_comercial") {
    filteredQuery = query.where(eq(crmPipeline.assignedTo, currentUser.email)) as any;
  }

  const allTasks = await filteredQuery.orderBy(desc(crmTasks.dueDate));

  // Handle fallback or clean mapping
  const mappedTasks = allTasks.map((t: any) => ({
    ...t,
    companyName: t.companyName || t.customerName || "Proyecto CYH",
  }));

  return (
    <div className="h-[calc(100vh-4rem)] w-full">
      <CalendarClient tasks={mappedTasks} currentUser={currentUser} />
    </div>
  );
}
