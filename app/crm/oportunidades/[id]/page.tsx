import React from "react";
import { redirect, notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { crmOpportunities, leads, crmCompanies, diagnosticReports, crmUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import OportunidadDetailClient from "./OportunidadDetailClient";
import { getMockOpportunities } from "@/lib/utils/mock-customers";

export const dynamic = "force-dynamic";

export default async function OportunidadDetailPage({
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

  let opportunityDetail: any = null;
  let allCrmUsers: any[] = [];
  let dbFailed = false;

  try {
    const results = await db.select({
      opportunity: crmOpportunities,
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
    .from(crmOpportunities)
    .leftJoin(leads, eq(crmOpportunities.leadId, leads.id))
    .leftJoin(crmCompanies, eq(leads.companyId, crmCompanies.id))
    .leftJoin(diagnosticReports, eq(crmOpportunities.diagnosticId, diagnosticReports.id))
    .where(eq(crmOpportunities.id, params.id));

    if (results.length > 0) {
      opportunityDetail = results[0];
    }
    
    allCrmUsers = await db.select().from(crmUsers);

  } catch (error) {
    console.error("Database connection failed for opportunity detail, falling back to mock", error);
    dbFailed = true;
  }

  if (!opportunityDetail) {
    // Check in-memory fallback
    const mockOpps = getMockOpportunities(userEmail);
    const mockOpp = mockOpps.find(o => o.opportunity.id === params.id);
    if (mockOpp) {
      opportunityDetail = mockOpp;
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

  // RBAC Access Restriction for Vendedores: cannot view opportunities assigned to other advisors
  if (isVendedor && opportunityDetail.opportunity.assignedTo?.toLowerCase() !== userEmail.toLowerCase()) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC] p-8 text-center min-h-[500px]">
        <div className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest text-red-600">Acceso Denegado</h2>
          <p className="text-xs text-slate-500 max-w-sm mt-2 font-semibold">
            Esta oportunidad comercial está asignada a otro asesor y no puede ser visualizada bajo su rol actual.
          </p>
        </div>
      </div>
    );
  }

  // TECNICO SECURITY MASKING: mask estimatedValue and weightedValue to 0
  if (isTecnico) {
    opportunityDetail = {
      ...opportunityDetail,
      opportunity: {
        ...opportunityDetail.opportunity,
        estimatedValue: 0,
        weightedValue: 0,
      }
    };
  }

  return (
    <OportunidadDetailClient 
      opportunityDetail={opportunityDetail}
      allCrmUsers={allCrmUsers}
      userRole={userRole}
      isAdmin={isAdmin}
      isTecnico={isTecnico}
    />
  );
}
