import React from "react";
import { db } from "@/lib/db";
import { diagnosticReports, leads, crmCompanies, crmUsers, crmCustomerPlants, crmCustomers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import RevisionesClient from "./RevisionesClient";

export const dynamic = "force-dynamic";

export default async function RevisionesPage() {
  const supabase = getSupabaseServer();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) {
    redirect("/login");
  }

  // Fetch current user details
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
  const allReports = await db.select({
    diagnostic: diagnosticReports,
    lead: {
      id: leads.id,
      fullName: leads.fullName,
      status: leads.status,
      riskLevel: leads.riskLevel,
      environmentType: leads.environmentType,
      city: leads.city
    },
    companyName: crmCompanies.name,
    customerName: crmCustomers.name
  })
  .from(diagnosticReports)
  .leftJoin(leads, eq(diagnosticReports.leadId, leads.id))
  .leftJoin(crmCompanies, eq(leads.companyId, crmCompanies.id))
  .leftJoin(crmCustomerPlants, eq(diagnosticReports.plantId, crmCustomerPlants.id))
  .leftJoin(crmCustomers, eq(crmCustomerPlants.customerId, crmCustomers.id))
  .orderBy(desc(diagnosticReports.createdAt));

  // Fallback to customerName if companyName is null
  const mappedReports = allReports.map((r: any) => ({
    ...r,
    companyName: r.companyName || r.customerName || "Proyecto CYH"
  }));

  return (
    <div className="h-[calc(100vh-4rem)] w-full">
      <RevisionesClient reports={mappedReports} currentUser={currentUser} />
    </div>
  );
}
