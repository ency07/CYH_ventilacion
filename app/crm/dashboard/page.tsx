import React from "react";
import { db } from "@/lib/db";
import { leads, crmUsers, crmTasks, diagnosticReports, crmOpportunities, crmPipeline } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { normalizeCity, getDepartmentByCity } from "@/lib/utils/normalization";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardGerencialPage() {
  const allLeads = await db.select().from(leads);

  const supabase = getSupabaseServer();
  const { data: authData } = await supabase.auth.getUser();
  
  let currentUser = { id: "", name: "Usuario", role: "vendedor", email: "" };
  if (authData?.user) {
    const [dbUser] = await db.select().from(crmUsers).where(eq(crmUsers.id, authData.user.id));
    if (dbUser) {
      currentUser = {
        id: dbUser.id,
        name: dbUser.fullName || authData.user.email?.split('@')[0] || "Usuario",
        role: dbUser.role,
        email: dbUser.email
      };
    }
  }

  // Redirect technical users to technical dashboard immediately
  if (currentUser.role === "tecnico" || currentUser.role === "ingeniero") {
    redirect("/crm/dashboard/tecnico");
  }

  let filteredLeads = allLeads;
  if (currentUser.role === "vendedor" || currentUser.role === "comercial") {
    const assignedPipelines = await db.select({ leadId: crmPipeline.leadId }).from(crmPipeline).where(eq(crmPipeline.assignedTo, currentUser.email));
    const assignedIds = new Set(assignedPipelines.map(p => p.leadId));
    filteredLeads = allLeads.filter(l => assignedIds.has(l.id));
  }

  // Geographic Sales Distribution query with joins
  const geoDataRaw = await db.select({
    city: leads.city,
    opportunityValue: crmOpportunities.estimatedValue,
    assignedTo: crmPipeline.assignedTo
  })
  .from(leads)
  .leftJoin(crmOpportunities, eq(leads.id, crmOpportunities.leadId))
  .leftJoin(crmPipeline, eq(leads.id, crmPipeline.leadId));

  // Role based filtering for data isolation
  let filteredGeo = geoDataRaw;
  if (currentUser.role === "vendedor" || currentUser.role === "comercial") {
    filteredGeo = geoDataRaw.filter(item => item.assignedTo === currentUser.email);
  }

  // Aggregate by city, grouping under "[Por Clasificar]" for empty, undefined, or unmatched values
  const geoGroupMap = new Map<string, { city: string; projectCount: number; financialVolume: number }>();

  filteredGeo.forEach(item => {
    const rawCity = item.city;
    const normalizedCity = normalizeCity(rawCity);
    const dept = getDepartmentByCity(normalizedCity);

    // If city is empty or doesn't map to a department, group under "[Por Clasificar]"
    const displayCity = (normalizedCity && dept) ? normalizedCity : "[Por Clasificar]";
    const value = item.opportunityValue || 0;

    const existing = geoGroupMap.get(displayCity);
    if (existing) {
      existing.projectCount += 1;
      existing.financialVolume += value;
    } else {
      geoGroupMap.set(displayCity, {
        city: displayCity,
        projectCount: 1,
        financialVolume: value
      });
    }
  });

  const geoData = Array.from(geoGroupMap.values()).sort((a, b) => b.financialVolume - a.financialVolume);

  let technicalMetrics = null;

  const allUsers = await db.select().from(crmUsers);
  const allTasks = await db.select().from(crmTasks);

  return (
    <DashboardClient 
      currentUser={currentUser} 
      allLeads={filteredLeads} 
      technicalMetrics={technicalMetrics} 
      allUsers={allUsers}
      allTasks={allTasks}
      geoData={geoData}
    />
  );
}
