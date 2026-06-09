import React from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { crmCustomers, crmCustomerPlants, crmCustomerContacts, crmProposals, crmDocuments, leads } from "@/lib/db/schema";
import { eq, inArray, desc } from "drizzle-orm";
import { getSupabaseServer } from "@/lib/supabase/server";
import ClientDetail from "./ClientDetail";
import { getMockCustomers, getMockPlants, getMockContacts } from "@/lib/utils/mock-customers";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = getSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    redirect("/login");
  }

  // Get current user profile and role
  const { data: profile } = await supabase
    .from("crm_users")
    .select("role, email")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role || "vendedor";
  const userEmail = profile?.email || user.email || "";

  const customerId = params.id;

  let customer: any = null;
  let plants: any[] = [];
  let contacts: any[] = [];
  let proposals: any[] = [];
  let documents: any[] = [];
  let dbFailed = false;

  try {
    customer = await db.query.crmCustomers.findFirst({
      where: eq(crmCustomers.id, customerId),
    });
  } catch (error) {
    console.error("Database connection failed for customer detail, trying fallback", error);
    dbFailed = true;
  }

  const isVendedor = ["vendedor", "comercial", "asesor_comercial"].includes(userRole);
  const isTecnico = ["tecnico", "ingeniero", "tecnico_preventa"].includes(userRole);

  if (dbFailed || !customer) {
    const mockCusts = getMockCustomers(userEmail);
    const mockCust = mockCusts.find((c) => c.id === customerId);
    if (mockCust) {
      customer = mockCust;
      const mockPls = getMockPlants();
      const mockCos = getMockContacts();

      plants = mockPls
        .filter((pl) => pl.customerId === customerId)
        .map((pl) => ({
          ...pl,
          diagnostics: [],
        }));
      contacts = mockCos.filter((co) => co.customerId === customerId);
      proposals = [];
      documents = [];
    } else {
      redirect("/crm/clientes?error=not_found");
    }
  } else {
    // Database query succeeded, load relations
    plants = await db.query.crmCustomerPlants.findMany({
      where: eq(crmCustomerPlants.customerId, customerId),
      with: {
        diagnostics: {
          orderBy: (diagnosticReports, { desc }) => [desc(diagnosticReports.createdAt)],
        },
      },
      orderBy: (crmCustomerPlants, { desc }) => [desc(crmCustomerPlants.createdAt)],
    });

    contacts = await db.query.crmCustomerContacts.findMany({
      where: eq(crmCustomerContacts.customerId, customerId),
      orderBy: (crmCustomerContacts, { desc }) => [desc(crmCustomerContacts.createdAt)],
    });

    const customerLeads = await db.query.leads.findMany({
      where: eq(leads.companyName, customer.name),
    });

    const leadIds = customerLeads.map((l) => l.id);

    if (leadIds.length > 0) {
      proposals = await db.query.crmProposals.findMany({
        where: inArray(crmProposals.leadId, leadIds),
        orderBy: (crmProposals, { desc }) => [desc(crmProposals.createdAt)],
      });

      documents = await db.query.crmDocuments.findMany({
        where: inArray(crmDocuments.leadId, leadIds),
        orderBy: (crmDocuments, { desc }) => [desc(crmDocuments.createdAt)],
      });
    }
  }

  // 2. RBAC check: Salesperson isolation
  if (isVendedor && customer.assignedTo && customer.assignedTo.toLowerCase() !== userEmail.toLowerCase()) {
    redirect("/crm/clientes?error=unauthorized");
  }

  // 3. Technical user security masking
  if (isTecnico && customer) {
    customer.ltv = 0;
    proposals = proposals.map(p => ({
      ...p,
      totalValue: 0,
    }));
  }

  return (
    <ClientDetail
      customer={customer}
      plants={plants}
      contacts={contacts}
      proposals={proposals}
      documents={documents}
      userRole={userRole}
      isTecnico={isTecnico}
      isAdmin={["admin", "super_admin", "director_comercial", "director"].includes(userRole)}
    />
  );
}
