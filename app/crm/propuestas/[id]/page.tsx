import React from "react";
import { redirect, notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { crmProposals, leads, crmCompanies, crmOpportunities, crmUsers, diagnosticReports } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import PropuestaDetailClient from "./PropuestaDetailClient";
import { getMockProposals } from "@/lib/utils/mock-customers";

export const dynamic = "force-dynamic";

export default async function PropuestaDetailPage({
  params,
}: {
  params: { id: string };
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

  let proposalDetail: any = null;
  let allCrmUsers: any[] = [];
  let dbFailed = false;

  try {
    const results = await db.select({
      proposal: crmProposals,
      lead: { 
        id: leads.id,
        fullName: leads.fullName,
        companyName: leads.companyName,
        email: leads.email,
        phone: leads.phone,
        city: leads.city,
        serviceType: leads.serviceType,
      },
      companyName: crmCompanies.name,
      opportunity: {
        id: crmOpportunities.id,
        title: crmOpportunities.title,
        estimatedValue: crmOpportunities.estimatedValue,
        probability: crmOpportunities.probability,
        assignedTo: crmOpportunities.assignedTo,
        stage: crmOpportunities.stage,
      },
      diagnosticReport: {
        id: diagnosticReports.id,
        leadId: diagnosticReports.leadId,
        airflow: diagnosticReports.airflow,
        dimensions: diagnosticReports.dimensions,
        technicalObservations: diagnosticReports.technicalObservations,
        materialSuggestions: diagnosticReports.materialSuggestions,
        recommendations: diagnosticReports.recommendations,
        inspectionProtocol: diagnosticReports.inspectionProtocol,
        status: diagnosticReports.status,
      },
    })
    .from(crmProposals)
    .leftJoin(leads, eq(crmProposals.leadId, leads.id))
    .leftJoin(crmCompanies, eq(leads.companyId, crmCompanies.id))
    .leftJoin(crmOpportunities, eq(leads.id, crmOpportunities.leadId))
    .leftJoin(diagnosticReports, eq(crmProposals.diagnosticId, diagnosticReports.id))
    .where(eq(crmProposals.id, params.id));

    if (results.length > 0) {
      proposalDetail = results[0];
    }
    
    allCrmUsers = await db.select().from(crmUsers);

  } catch (error) {
    console.error("Database connection failed for proposal detail, falling back to mock", error);
    dbFailed = true;
  }

  if (!proposalDetail) {
    // Check in-memory fallback
    const mockProps = getMockProposals(userEmail);
    const mockProp = mockProps.find(p => p.proposal.id === params.id);
    if (mockProp) {
      proposalDetail = mockProp;
      allCrmUsers = [
        {
          id: user.id,
          email: userEmail,
          fullName: dbUser?.fullName || "Asesor Actual",
          role: userRole,
        }
      ];
    } else {
      notFound();
    }
  }

  // RBAC Access Restriction for Vendedores: cannot view proposals assigned to other advisors
  if (isVendedor && proposalDetail.opportunity?.assignedTo?.toLowerCase() !== userEmail.toLowerCase()) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC] p-8 text-center min-h-[500px]">
        <div className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest text-red-650">Acceso Denegado</h2>
          <p className="text-xs text-slate-500 max-w-sm mt-2 font-semibold">
            Esta propuesta comercial pertenece a un cliente asignado a otro asesor y no puede ser visualizada.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PropuestaDetailClient 
      proposalDetail={proposalDetail}
      allCrmUsers={allCrmUsers}
      userRole={userRole}
      isAdmin={isAdmin}
    />
  );
}
