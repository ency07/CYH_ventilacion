import React from "react";
import { db } from "@/lib/db";
import { crmTasks, leads, crmCompanies, crmCustomers, crmPipeline, crmUsers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import TareasClient from "./TareasClient";

export const dynamic = "force-dynamic";

export default async function TareasPage() {
  const supabase = getSupabaseServer();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) {
    redirect("/login");
  }

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

  const query = db.select({
    task: crmTasks,
    leadName: leads.fullName,
    companyName: crmCompanies.name,
    customerName: crmCustomers.name,
    environmentType: leads.environmentType,
    city: leads.city
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

  // Map tasks to ensure customer names and fallback details are structured correctly
  const mappedTasks = allTasks.map((t: any) => ({
    ...t,
    companyName: t.companyName || t.customerName || "Proyecto CYH",
  }));

  return (
    <div className="w-full bg-bg-secondary">
      <TareasClient tasksData={mappedTasks} />
    </div>
  );
}
