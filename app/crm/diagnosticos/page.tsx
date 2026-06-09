import React from "react";
import { db } from "@/lib/db";
import { diagnosticReports, leads, crmCompanies, crmUsers, crmCustomerPlants, crmCustomers, crmPipeline } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import DiagnosticosClient from "./DiagnosticosClient";

export const dynamic = "force-dynamic";

export default async function DiagnosticosPage() {
  const supabase = getSupabaseServer();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) {
    redirect("/login");
  }

  const [dbUser] = await db.select().from(crmUsers).where(eq(crmUsers.id, authData.user.id));
  if (!dbUser) {
    redirect("/login");
  }

  const userRole = dbUser.role;
  const userEmail = dbUser.email;
  const userId = dbUser.id;

  // Query base select
  const query = db.select({
    diagnostic: diagnosticReports,
    lead: {
      id: leads.id,
      fullName: leads.fullName,
      status: leads.status,
      riskLevel: leads.riskLevel,
      city: leads.city,
      environmentType: leads.environmentType,
      serviceType: leads.serviceType
    },
    companyName: crmCompanies.name,
    customerName: crmCustomers.name
  })
  .from(diagnosticReports)
  .leftJoin(leads, eq(diagnosticReports.leadId, leads.id))
  .leftJoin(crmCompanies, eq(leads.companyId, crmCompanies.id))
  .leftJoin(crmCustomerPlants, eq(diagnosticReports.plantId, crmCustomerPlants.id))
  .leftJoin(crmCustomers, eq(crmCustomerPlants.customerId, crmCustomers.id))
  .leftJoin(crmPipeline, eq(leads.id, crmPipeline.leadId));

  let filteredQuery = query;
  if (userRole === "tecnico" || userRole === "ingeniero") {
    filteredQuery = query.where(eq(diagnosticReports.createdBy, userId)) as any;
  } else if (userRole === "comercial" || userRole === "vendedor" || userRole === "asesor_comercial") {
    filteredQuery = query.where(eq(crmPipeline.assignedTo, userEmail)) as any;
  }

  const allDiagnosticos = await filteredQuery.orderBy(desc(diagnosticReports.createdAt));

  // If companyName is null but customerName exists, fallback to customerName
  const mappedDiagnosticos = allDiagnosticos.map((item: any) => ({
    ...item,
    companyName: item.companyName || item.customerName || "Proyecto CYH"
  }));

  return (
    <div className="h-[calc(100vh-4rem)] w-full">
      <DiagnosticosClient diagnosticosData={mappedDiagnosticos} />
    </div>
  );
}
