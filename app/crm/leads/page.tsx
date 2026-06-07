import React from "react";
import { redirect } from "next/navigation";
import { getAllLeadsWithCrmDataAction } from "@/lib/server-actions/crm";
import { db } from "@/lib/db";
import { crmCompanies, crmContacts, crmTasks, crmUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSupabaseServer } from "@/lib/supabase/server";
import LeadsClient from "./LeadsClient";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const supabase = getSupabaseServer();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) {
    redirect("/login");
  }

  // Fetch role check from Drizzle
  const [dbUser] = await db.select().from(crmUsers).where(eq(crmUsers.id, authData.user.id));
  const userRole = dbUser?.role || "vendedor";

  // Strict RBAC: Technicians (tecnico / ingeniero) are blocked from this commercial route at server level
  if (userRole === "tecnico" || userRole === "ingeniero") {
    redirect("/crm/diagnosticos");
  }

  const result = await getAllLeadsWithCrmDataAction();
  const safeLeads = result.success ? (result.data || []) : [];

  // Filter out leads that are "ganado" (won) because they should be in Clientes, not Leads inbox
  const activeLeads = safeLeads.filter(l => l.status !== "ganado");

  // Fetch real data from PostgreSQL
  const dbCompanies = await db.select().from(crmCompanies);
  const dbContacts = await db.select().from(crmContacts);
  const dbTasks = await db.select().from(crmTasks);
  const allCrmUsers = await db.select().from(crmUsers);

  let currentUser = { id: "", name: "Usuario", role: "vendedor", email: "" };
  if (authData?.user) {
    const [dbUser] = await db.select().from(crmUsers).where(eq(crmUsers.id, authData.user.id));
    if (dbUser) {
      currentUser = {
        id: dbUser.id,
        name: dbUser.fullName || authData.user.email?.split('@')[0] || "Usuario",
        role: dbUser.role,
        email: dbUser.email
      };
    }
  }

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
        currentUser={currentUser}
        allCrmUsers={allCrmUsers}
      />
    </div>
  );
}
