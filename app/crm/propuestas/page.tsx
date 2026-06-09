import React from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { crmProposals, leads, crmCompanies, crmOpportunities, crmUsers } from "@/lib/db/schema";
import { eq, desc, ne, and, or } from "drizzle-orm";
import { getSupabaseServer } from "@/lib/supabase/server";
import PropuestasClient from "./PropuestasClient";
import { getMockProposals } from "@/lib/utils/mock-customers";

export const dynamic = "force-dynamic";

async function seedMockProposalsIfEmpty(userEmail: string) {
  try {
    const existing = await db.select().from(crmProposals).limit(1);
    if (existing.length === 0) {
      // Find opportunities seeded
      const opps = await db.select().from(crmOpportunities).limit(3);
      if (opps.length > 0) {
        let version = 1;
        for (const opp of opps) {
          let status = "borrador";
          if (opp.stage === "propuesta") status = "borrador";
          else if (opp.stage === "negociacion") status = "enviada";
          else if (opp.stage === "cerrado_ganado") status = "aceptada";

          let validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          if (opp.title.includes("Nave de Ácidos")) {
            // make this one expired
            validUntil = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
            status = "enviada";
          }

          await db.insert(crmProposals).values({
            leadId: opp.leadId,
            diagnosticId: opp.diagnosticId,
            title: `CYH-COT-${opp.title.slice(0, 20)}`,
            version: version++,
            totalValue: opp.estimatedValue,
            status,
            validUntil,
          });
        }
      }
    }
  } catch (err) {
    console.error("Error seeding crm proposals:", err);
  }
}

export default async function PropuestasPage({
  searchParams,
}: {
  searchParams: { estado?: string; q?: string };
}) {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch role check from Drizzle
  const [dbUser] = await db.select().from(crmUsers).where(eq(crmUsers.id, user.id));
  const userRole = dbUser?.role || "vendedor";
  const userEmail = dbUser?.email || user.email || "";

  // Normalize roles
  const isAdmin = ["admin", "super_admin", "director_comercial", "director"].includes(userRole);
  const isVendedor = ["vendedor", "comercial", "asesor_comercial"].includes(userRole);
  const isTecnico = ["tecnico", "ingeniero", "tecnico_preventa"].includes(userRole);

  // TECNICO / INGENIERO: Access Denied! Expel immediately
  if (isTecnico) {
    redirect("/crm/diagnosticos");
  }

  const statusFilter = searchParams?.estado || "all";
  const query = searchParams?.q || "";

  let proposals: any[] = [];
  let activeLeads: any[] = [];
  let kpis = {
    totalPresented: 0,
    winRate: 0,
    avgAcceptDays: 0,
  };
  let dbFailed = false;

  try {
    // Attempt database seeding
    await seedMockProposalsIfEmpty(userEmail);

    // Apply strict filtering
    let conditions = [];
    if (isVendedor) {
      conditions.push(eq(crmOpportunities.assignedTo, userEmail));
    }
    if (statusFilter && statusFilter !== "all") {
      conditions.push(eq(crmProposals.status, statusFilter));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch proposals
    proposals = await db.select({
      proposal: crmProposals,
      lead: {
        id: leads.id,
        fullName: leads.fullName,
        status: leads.status,
        companyName: leads.companyName,
      },
      companyName: crmCompanies.name,
      opportunity: {
        id: crmOpportunities.id,
        title: crmOpportunities.title,
        estimatedValue: crmOpportunities.estimatedValue,
        probability: crmOpportunities.probability,
        assignedTo: crmOpportunities.assignedTo,
      }
    })
    .from(crmProposals)
    .leftJoin(leads, eq(crmProposals.leadId, leads.id))
    .leftJoin(crmCompanies, eq(leads.companyId, crmCompanies.id))
    .leftJoin(crmOpportunities, eq(leads.id, crmOpportunities.leadId))
    .where(whereClause)
    .orderBy(desc(crmProposals.updatedAt));

    activeLeads = await db.select({
      id: leads.id,
      fullName: leads.fullName,
      companyName: leads.companyName
    })
    .from(leads)
    .where(ne(leads.status, "ganado"))
    .orderBy(desc(leads.createdAt));

    // Calculate KPIs from DB data
    const allUserProps = await db.select({
      status: crmProposals.status,
      createdAt: crmProposals.createdAt,
      approvedAt: crmProposals.approvedAt,
      updatedAt: crmProposals.updatedAt,
    })
    .from(crmProposals)
    .leftJoin(crmOpportunities, eq(crmProposals.leadId, crmOpportunities.leadId))
    .where(isVendedor ? eq(crmOpportunities.assignedTo, userEmail) : undefined);

    const total = allUserProps.length;
    const accepted = allUserProps.filter(p => p.status === "aceptada").length;
    
    // Average days calculation
    const acceptedProps = allUserProps.filter(p => p.status === "aceptada");
    let totalDays = 0;
    acceptedProps.forEach(p => {
      const end = p.approvedAt || p.updatedAt;
      const start = p.createdAt;
      const diff = new Date(end).getTime() - new Date(start).getTime();
      totalDays += Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
    });

    kpis = {
      totalPresented: allUserProps.filter(p => p.status !== "borrador").length,
      winRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
      avgAcceptDays: acceptedProps.length > 0 ? Math.round(totalDays / acceptedProps.length) : 12,
    };

  } catch (error) {
    console.error("Database connection failed, falling back to mock proposals", error);
    dbFailed = true;

    const mockProps = getMockProposals(userEmail);

    // Apply filtering in memory
    proposals = mockProps.filter(p => {
      const matchesRbac = !isVendedor || p.opportunity.assignedTo?.toLowerCase() === userEmail.toLowerCase();
      const matchesStatus = statusFilter === "all" || p.proposal.status === statusFilter;
      return matchesRbac && matchesStatus;
    });

    activeLeads = mockProps.map(p => ({
      id: p.lead.id,
      fullName: p.lead.fullName,
      companyName: p.lead.companyName,
    }));

    // Calculate KPIs in memory
    const kpiBase = mockProps.filter(p => !isVendedor || p.opportunity.assignedTo?.toLowerCase() === userEmail.toLowerCase());
    const total = kpiBase.length;
    const accepted = kpiBase.filter(p => p.proposal.status === "aceptada").length;

    kpis = {
      totalPresented: kpiBase.filter(p => p.proposal.status !== "borrador").length,
      winRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
      avgAcceptDays: 14,
    };
  }

  return (
    <PropuestasClient 
      initialProposals={proposals}
      activeLeads={activeLeads}
      kpis={kpis}
      userRole={userRole}
      isAdmin={isAdmin}
      initialQuery={query}
      initialEstado={statusFilter}
    />
  );
}
