import React from "react";
import { db } from "@/lib/db";
import { crmProposals, leads, crmCompanies } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import PropuestasClient from "./PropuestasClient";

export const dynamic = "force-dynamic";

export default async function PropuestasPage() {
  const proposals = await db.select({
    proposal: crmProposals,
    lead: {
      id: leads.id,
      fullName: leads.fullName,
      status: leads.status,
    },
    companyName: crmCompanies.name
  })
  .from(crmProposals)
  .leftJoin(leads, eq(crmProposals.leadId, leads.id))
  .leftJoin(crmCompanies, eq(leads.companyId, crmCompanies.id))
  .orderBy(desc(crmProposals.updatedAt));

  return (
    <div className="h-[calc(100vh-4rem)] w-full">
      <PropuestasClient proposalsData={proposals} />
    </div>
  );
}
