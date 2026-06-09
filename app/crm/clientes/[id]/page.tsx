import React from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { crmCustomers, crmCustomerPlants, crmCustomerContacts, crmProposals, crmDocuments, leads } from "@/lib/db/schema";
import { eq, inArray, desc } from "drizzle-orm";
import { getSupabaseServer } from "@/lib/supabase/server";
import ClientDetail from "./ClientDetail";

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

  // 1. Fetch customer detail
  const customer = await db.query.crmCustomers.findFirst({
    where: eq(crmCustomers.id, customerId),
  });

  if (!customer) {
    redirect("/crm/clientes?error=not_found");
  }

  // 2. RBAC check: Salesperson isolation
  const isVendedor = ["vendedor", "comercial", "asesor_comercial"].includes(userRole);
  const isTecnico = ["tecnico", "ingeniero", "tecnico_preventa"].includes(userRole);

  if (isVendedor && customer.assignedTo && customer.assignedTo.toLowerCase() !== userEmail.toLowerCase()) {
    redirect("/crm/clientes?error=unauthorized");
  }

  // 3. Fetch plants (locations) with their nested technical measurements
  const plants = await db.query.crmCustomerPlants.findMany({
    where: eq(crmCustomerPlants.customerId, customerId),
    with: {
      diagnostics: {
        orderBy: (diagnosticReports, { desc }) => [desc(diagnosticReports.createdAt)],
      },
    },
    orderBy: (crmCustomerPlants, { desc }) => [desc(crmCustomerPlants.createdAt)],
  });

  // 4. Fetch contacts
  const contacts = await db.query.crmCustomerContacts.findMany({
    where: eq(crmCustomerContacts.customerId, customerId),
    orderBy: (crmCustomerContacts, { desc }) => [desc(crmCustomerContacts.createdAt)],
  });

  // 5. Fetch sales leads associated with this company name to resolve proposals/documents
  const customerLeads = await db.query.leads.findMany({
    where: eq(leads.companyName, customer.name),
  });

  const leadIds = customerLeads.map((l) => l.id);

  // 6. Fetch proposals and uploaded documents linked to those leads
  let proposals: (typeof crmProposals.$inferSelect)[] = [];
  let documents: (typeof crmDocuments.$inferSelect)[] = [];

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
