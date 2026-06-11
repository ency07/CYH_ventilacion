import React from "react";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { logoutAction } from "@/lib/server-actions/auth";
import { db } from "@/lib/db";
import { 
  crmCustomers, 
  crmCustomerPlants, 
  crmCustomerContacts, 
  crmServiceRequests, 
  leads, 
  crmProposals, 
  crmDocuments,
  crmActivityLogs,
  crmAuditLogs,
  diagnosticReports
} from "@/lib/db/schema";
import { eq, or, inArray, desc, and } from "drizzle-orm";
import PortalClient from "./PortalClient";
import { Building } from "lucide-react";

export const metadata = {
  title: "Portal de Clientes - CYH",
  description: "Acceso exclusivo para cuentas corporativas y clientes de CYH.",
};

export const dynamic = "force-dynamic";

export default async function PortalInicioPage() {
  const supabase = getSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    redirect("/login");
  }

  // 1. Fetch user profile and validate role
  const { data: profile } = await supabase
    .from("crm_users")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role || "cliente";

  // Prevent root_dev from entering the client B2B portal (per requirements)
  if (userRole === "root_dev") {
    redirect("/crm/dashboard");
  }

  // 2. Resolve customer contact (handling backward compatibility with user email)
  let contact = await db.query.crmCustomerContacts.findFirst({
    where: eq(crmCustomerContacts.userId, user.id),
    with: {
      customer: true,
    }
  });

  if (!contact && user.email) {
    const emailContact = await db.query.crmCustomerContacts.findFirst({
      where: eq(crmCustomerContacts.email, user.email),
      with: {
        customer: true,
      }
    });

    if (emailContact) {
      // Establish direct relational userId mapping
      await db.update(crmCustomerContacts)
        .set({ userId: user.id })
        .where(eq(crmCustomerContacts.id, emailContact.id));
      contact = { ...emailContact, userId: user.id };
    }
  }

  // 3. Pending Association Block (Pilar IV - No Mock Data on Production)
  if (!contact || !contact.customerId) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-sans selection:bg-emerald-500/30 selection:text-emerald-300 px-6">
        <div className="max-w-md w-full p-8 bg-slate-900 border border-slate-800/80 rounded-2xl text-center shadow-2xl">
          <div className="h-12 w-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
            <Building className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Vinculación Pendiente</h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            Su usuario de acceso aún no ha sido asociado a una cuenta de cliente corporativo en nuestro sistema CRM.
          </p>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 mb-6">
            <p className="text-[11px] text-slate-500 uppercase tracking-widest font-mono mb-1">Contacto de Soporte</p>
            <span className="font-mono text-sm font-semibold text-emerald-400">soporte@empresa.com</span>
          </div>
          <form action={logoutAction}>
            <button 
              type="submit" 
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold tracking-wide transition-colors border border-slate-700/50"
            >
              Cerrar Sesión
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 4. Secure Data Fetching for customer company and assets
  const customerId = contact.customerId;
  const customer = contact.customer;

  // Plants
  const plants = await db.query.crmCustomerPlants.findMany({
    where: eq(crmCustomerPlants.customerId, customerId),
  });
  const plantIds = plants.map(p => p.id);

  // Service requests
  const serviceRequests = await db.query.crmServiceRequests.findMany({
    where: eq(crmServiceRequests.customerId, customerId),
    orderBy: [desc(crmServiceRequests.createdAt)],
  });

  // Leads / Projects
  const customerLeads = await db.query.leads.findMany({
    where: or(
      eq(leads.companyName, customer.name),
      eq(leads.email, user.email || "")
    ),
  });
  const leadIds = customerLeads.map(l => l.id);

  // Diagnostic Reports for Inspections
  const customerDiagnostics = leadIds.length > 0 ? await db.query.diagnosticReports.findMany({
    where: inArray(diagnosticReports.leadId, leadIds),
    orderBy: [desc(diagnosticReports.createdAt)],
  }) : [];

  // Proposals (COP values)
  const proposals = leadIds.length > 0 ? await db.query.crmProposals.findMany({
    where: inArray(crmProposals.leadId, leadIds),
    orderBy: [desc(crmProposals.createdAt)],
  }) : [];

  // Documents with cross-tenant double validation
  const documents = await db.query.crmDocuments.findMany({
    where: or(
      eq(crmDocuments.customerId, customerId),
      leadIds.length > 0 ? inArray(crmDocuments.leadId, leadIds) : undefined
    ),
    orderBy: [desc(crmDocuments.createdAt)],
  });

  // Recent Activity logs feed (Activity Logs + Audit Logs)
  const activities = leadIds.length > 0 ? await db.query.crmActivityLogs.findMany({
    where: inArray(crmActivityLogs.leadId, leadIds),
    orderBy: [desc(crmActivityLogs.createdAt)],
    limit: 10,
  }) : [];

  const audits = await db.query.crmAuditLogs.findMany({
    where: eq(crmAuditLogs.actorId, user.id),
    orderBy: [desc(crmAuditLogs.createdAt)],
    limit: 10,
  });

  const userName = profile?.full_name || contact.fullName || user.email?.split("@")[0] || "Cliente CYH";

  return (
    <PortalClient
      customer={customer}
      plants={plants}
      serviceRequests={serviceRequests}
      leads={customerLeads}
      proposals={proposals}
      documents={documents}
      diagnostics={customerDiagnostics}
      activities={activities}
      audits={audits}
      user={{ id: user.id, email: user.email || "", fullName: userName, role: userRole }}
    />
  );
}
