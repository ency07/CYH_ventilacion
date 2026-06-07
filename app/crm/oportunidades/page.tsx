import React from "react";
import { db } from "@/lib/db";
import { crmOpportunities, leads, crmCompanies } from "@/lib/db/schema";
import { eq, desc, ne } from "drizzle-orm";
import OportunidadesClient from "./OportunidadesClient";

export const dynamic = "force-dynamic";

export default async function OportunidadesPage() {
  const allOpps = await db.select({
    opportunity: crmOpportunities,
    lead: { id: leads.id },
    companyName: crmCompanies.name,
  })
  .from(crmOpportunities)
  .leftJoin(leads, eq(crmOpportunities.leadId, leads.id))
  .leftJoin(crmCompanies, eq(leads.companyId, crmCompanies.id))
  .orderBy(desc(crmOpportunities.expectedCloseDate));

  const activeLeads = await db.select({
    id: leads.id,
    fullName: leads.fullName,
    companyName: leads.companyName
  })
  .from(leads)
  .where(ne(leads.status, "ganado"))
  .orderBy(desc(leads.createdAt));

  return (
    <OportunidadesClient initialOpps={allOpps} activeLeads={activeLeads} />
  );
}
