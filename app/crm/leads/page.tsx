import React from "react";
import { getAllLeadsWithCrmDataAction } from "@/lib/server-actions/crm";
import { db } from "@/lib/db";
import { crmCompanies, crmContacts, crmTasks } from "@/lib/db/schema";
import LeadsClient from "./LeadsClient";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const result = await getAllLeadsWithCrmDataAction();
  const safeLeads = result.success ? (result.data || []) : [];

  // Filter out leads that are "ganado" (won) because they should be in Clientes, not Leads inbox
  const activeLeads = safeLeads.filter(l => l.status !== "ganado");

  // Fetch real data from PostgreSQL
  const dbCompanies = await db.select().from(crmCompanies);
  const dbContacts = await db.select().from(crmContacts);
  const dbTasks = await db.select().from(crmTasks);

  // Map contacts to match client props format (firstName, lastName, etc.)
  const mappedContacts = dbContacts.map(c => {
    const parts = (c.fullName || "").trim().split(/\s+/);
    return {
      id: c.id,
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" ") || "",
      title: c.cargo || "Sin Cargo",
      email: c.email,
      phone: c.phone,
      companyId: c.companyId
    };
  });

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col w-full relative overflow-hidden">
      <LeadsClient 
        leads={activeLeads} 
        companies={dbCompanies} 
        contacts={mappedContacts} 
        tasks={dbTasks} 
      />
    </div>
  );
}
