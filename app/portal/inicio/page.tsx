import React from "react";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { logoutAction } from "@/lib/server-actions/auth";
import { getTenantBrandingAction } from "@/lib/server-actions/config";
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
  diagnosticReports,
  crmTicketComments,
  crmNotifications,
  crmContracts,
  crmInvoices,
  crmAssets,
  crmMaintenancePlans,
  crmWorkOrders
} from "@/lib/db/schema";
import { eq, or, inArray, desc, and } from "drizzle-orm";
import PortalClient from "./PortalClient";
import { Building } from "lucide-react";
import { headers } from "next/headers";

export const metadata = {
  title: "Portal de Clientes - CYH",
  description: "Acceso exclusivo para cuentas corporativas y clientes de CYH.",
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: {
    customerId?: string;
  };
}

export default async function PortalInicioPage({ searchParams }: PageProps) {
  const supabase = getSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    redirect("/login?from=portal");
  }

  // 1. Fetch user profile and validate role
  const { data: profile } = await supabase
    .from("crm_users")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role || "cliente";

  let customerId: string | null = null;
  let customer: typeof crmCustomers.$inferSelect | null = null;
  let isImpersonating = false;

  const targetCustomerId = searchParams?.customerId;

  if (targetCustomerId) {
    // Check if user has permission to impersonate (admin or root_dev)
    const canImpersonate = ["admin", "super_admin", "root_dev", "director_comercial", "director"].includes(userRole);
    if (!canImpersonate) {
      console.warn(`[AppSec Warning] Intento de impersonación no autorizado por usuario ${user.email}`);
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-sans px-6">
          <div className="max-w-md w-full p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center">
            <h2 className="text-xl font-bold text-rose-500 mb-2">Acceso Denegado</h2>
            <p className="text-xs text-slate-400">No tiene permisos para ver este portal en modo supervisión.</p>
          </div>
        </div>
      );
    }

    // Verify customer exists
    const impersonatedCustomer = await db.query.crmCustomers.findFirst({
      where: eq(crmCustomers.id, targetCustomerId),
    });

    if (!impersonatedCustomer) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-sans px-6">
          <div className="max-w-md w-full p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center">
            <h2 className="text-xl font-bold text-white mb-2">Cliente no encontrado</h2>
            <p className="text-xs text-slate-400 font-mono">El ID de cliente solicitado ({targetCustomerId}) no existe.</p>
          </div>
        </div>
      );
    }

    customerId = targetCustomerId;
    customer = impersonatedCustomer;
    isImpersonating = true;

    // Log the impersonation action immediately (Pilar X)
    const reqHeaders = headers();
    const userAgent = reqHeaders.get("user-agent") || "Unknown";
    const ipAddress = reqHeaders.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    await db.insert(crmAuditLogs).values({
      actorId: user.id,
      action: "portal_impersonation",
      entityAffected: `crm_customers:${customerId}`,
      ipAddress: ipAddress,
      userAgent: userAgent,
      metadata: {
        userId: user.id,
        email: user.email || "",
        action: "impersonate",
        origin: "portal_cliente",
        impersonatedCustomerId: customerId,
        customerName: impersonatedCustomer.name,
      } as any,
    });
  } else {
    // If the user role is authorized to impersonate, redirect them to the first customer's view
    const canImpersonate = ["admin", "super_admin", "root_dev", "director_comercial", "director"].includes(userRole);
    if (canImpersonate) {
      const firstCustomer = await db.query.crmCustomers.findFirst({
        orderBy: desc(crmCustomers.createdAt),
      });

      if (firstCustomer) {
        redirect(`/portal/inicio?customerId=${firstCustomer.id}`);
      }
    }

    const isCrmStaff = ["vendedor", "comercial", "tecnico", "ingeniero"].includes(userRole);
    if (isCrmStaff) {
      redirect("/crm/pipeline");
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

    customerId = contact.customerId;
    customer = contact.customer;
  }

  // 4. Secure Data Fetching for customer company and assets
  // Plants
  const plants = await db.query.crmCustomerPlants.findMany({
    where: eq(crmCustomerPlants.customerId, customerId),
  });
  const plantIds = plants.map(p => p.id);

  // CMMS Data Fetching
  const assets = plantIds.length > 0 ? await db.query.crmAssets.findMany({
    where: inArray(crmAssets.plantId, plantIds),
    orderBy: [desc(crmAssets.createdAt)],
  }) : [];

  const assetIds = assets.map(a => a.id);
  const maintenancePlans = assetIds.length > 0 ? await db.query.crmMaintenancePlans.findMany({
    where: inArray(crmMaintenancePlans.assetId, assetIds),
  }) : [];

  const workOrders = assetIds.length > 0 ? await db.query.crmWorkOrders.findMany({
    where: inArray(crmWorkOrders.assetId, assetIds),
    orderBy: [desc(crmWorkOrders.createdAt)],
  }) : [];

  // Service requests with technical comments
  const serviceRequests = await db.query.crmServiceRequests.findMany({
    where: eq(crmServiceRequests.customerId, customerId),
    with: {
      comments: {
        with: {
          actor: true,
        },
        orderBy: [desc(crmTicketComments.createdAt)],
      },
    },
    orderBy: [desc(crmServiceRequests.createdAt)],
  });

  // Bell Notifications for customer portal header
  const notifications = await db.query.crmNotifications.findMany({
    where: and(
      eq(crmNotifications.customerId, customerId),
      eq(crmNotifications.channel, "bell")
    ),
    orderBy: [desc(crmNotifications.createdAt)],
    limit: 30,
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

  // Fetch Contracts
  const contracts = await db.query.crmContracts.findMany({
    where: eq(crmContracts.customerId, customerId),
    orderBy: [desc(crmContracts.createdAt)],
  });

  // Fetch Invoices with Accounts Receivable relationship
  const invoices = await db.query.crmInvoices.findMany({
    where: eq(crmInvoices.customerId, customerId),
    with: {
      accountsReceivable: true,
    },
    orderBy: [desc(crmInvoices.createdAt)],
  });

  // Fetch list of all customers for switcher dropdown in Modo Supervisión (Super Powers)
  let allCustomers: Array<{ id: string; name: string }> = [];
  const canImpersonate = ["admin", "super_admin", "root_dev", "director_comercial", "director"].includes(userRole);
  if (canImpersonate) {
    allCustomers = await db.select({
      id: crmCustomers.id,
      name: crmCustomers.name,
    })
    .from(crmCustomers)
    .orderBy(desc(crmCustomers.createdAt));
  }

  const userName = profile?.full_name || user.email?.split("@")[0] || "Cliente CYH";

  // Fetch tenant branding on the server (SSR)
  const brandingRes = await getTenantBrandingAction();
  const initialBranding = brandingRes.success && brandingRes.data ? {
    companyName: brandingRes.data.config.companyName,
    logoUrl: brandingRes.data.branding.logoUrl,
    logoDarkUrl: brandingRes.data.branding.logoDarkUrl,
    portalBgUrl: brandingRes.data.branding.portalBgUrl,
    primaryColor: brandingRes.data.branding.primaryColor,
    secondaryColor: brandingRes.data.branding.secondaryColor,
    btnColor: brandingRes.data.branding.btnColor,
    portalColor: brandingRes.data.branding.portalColor,
    portalConfig: brandingRes.data.branding.portalConfig,
  } : null;

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
      notifications={notifications}
      contracts={contracts}
      invoices={invoices}
      assets={assets}
      maintenancePlans={maintenancePlans}
      workOrders={workOrders}
      user={{ id: user.id, email: user.email || "", fullName: userName, role: userRole }}
      isImpersonating={isImpersonating}
      allCustomers={allCustomers}
      initialBranding={initialBranding}
    />
  );
}
