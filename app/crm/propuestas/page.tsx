import React from "react";
import { db } from "@/lib/db";
import { crmProposals, leads, crmCompanies } from "@/lib/db/schema";
import { eq, desc, ne } from "drizzle-orm";
import PropuestasClient from "./PropuestasClient";
import { getSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PropuestasPage() {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  let userRole = "comercial";
  if (user) {
    const { data: profile } = await supabase
      .from("crm_users")
      .select("role")
      .eq("id", user.id)
      .single();
    userRole = profile?.role || "comercial";
  }

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

  const activeLeads = await db.select({
    id: leads.id,
    fullName: leads.fullName,
    companyName: leads.companyName
  })
  .from(leads)
  .where(ne(leads.status, "ganado"))
  .orderBy(desc(leads.createdAt));

  return (
    <div className="h-[calc(100vh-4rem)] w-full">
      <PropuestasClient proposalsData={proposals} activeLeads={activeLeads} userRole={userRole} />
    </div>
  );
}

