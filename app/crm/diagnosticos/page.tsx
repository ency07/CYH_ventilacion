import React from "react";
import { db } from "@/lib/db";
import { diagnosticReports, leads, crmCompanies } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import DiagnosticosClient from "./DiagnosticosClient";

export const dynamic = "force-dynamic";

export default async function DiagnosticosPage() {
  const allDiagnosticos = await db.select({
    diagnostic: diagnosticReports,
    lead: {
      id: leads.id,
      fullName: leads.fullName,
      status: leads.status,
      riskLevel: leads.riskLevel,
      city: leads.city
    },
    companyName: crmCompanies.name
  })
  .from(diagnosticReports)
  .leftJoin(leads, eq(diagnosticReports.leadId, leads.id))
  .leftJoin(crmCompanies, eq(leads.companyId, crmCompanies.id))
  .orderBy(desc(diagnosticReports.createdAt));

  return (
    <div className="h-[calc(100vh-4rem)] w-full">
      <DiagnosticosClient diagnosticosData={allDiagnosticos} />
    </div>
  );
}
