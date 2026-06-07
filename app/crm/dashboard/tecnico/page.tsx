import React from "react";
import { db } from "@/lib/db";
import { leads, crmUsers, crmTasks, diagnosticReports } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "../DashboardClient";

export const dynamic = "force-dynamic";

export default async function TechnicalDashboardPage() {
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
    name: dbUser.fullName || authData.user.email?.split('@')[0] || "Usuario",
    role: dbUser.role,
    email: dbUser.email
  };

  if (currentUser.role !== "tecnico" && currentUser.role !== "ingeniero") {
    redirect("/crm/dashboard");
  }

  // Fetch preventa technical diagnostics for current user
  const diags = await db.select().from(diagnosticReports).where(eq(diagnosticReports.createdBy, currentUser.id));
  const pendingDiags = diags.filter(d => d.status === "pendiente").length;
  const approvedDiags = diags.filter(d => d.status === "aprobado" || d.status === "completado").length;

  const userTasks = await db.select().from(crmTasks).where(eq(crmTasks.assignedTo, currentUser.email));
  const pendingTasks = userTasks.filter(t => t.status === "pendiente").length;

  const technicalMetrics = {
    totalDiagnostics: diags.length,
    pendingDiagnostics: pendingDiags,
    approvedDiagnostics: approvedDiags,
    pendingTasks,
    diagnosticsList: diags.slice(0, 5)
  };

  const allUsers = await db.select().from(crmUsers);
  const allTasks = await db.select().from(crmTasks);

  return (
    <DashboardClient 
      currentUser={currentUser} 
      allLeads={[]} 
      technicalMetrics={technicalMetrics} 
      allUsers={allUsers}
      allTasks={allTasks}
    />
  );
}
