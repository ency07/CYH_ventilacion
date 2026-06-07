import React from "react";
import { redirect } from "next/navigation";
import { getAllLeadsWithCrmDataAction } from "@/lib/server-actions/crm";
import { db } from "@/lib/db";
import { crmUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSupabaseServer } from "@/lib/supabase/server";
import PipelineClient from "./PipelineClient";
import { Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PipelinePage({ searchParams }: { searchParams: { view?: string } }) {
  const supabase = getSupabaseServer();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) {
    redirect("/login");
  }

  // Fetch role check from Drizzle
  const [dbUser] = await db.select().from(crmUsers).where(eq(crmUsers.id, authData.user.id));
  const userRole = dbUser?.role || "vendedor";

  // Strict RBAC: Technicians (tecnico / ingeniero) are blocked from this commercial/financial route
  if (userRole === "tecnico" || userRole === "ingeniero") {
    redirect("/crm/diagnosticos");
  }

  // Fetch Leads using the secure server action
  const result = await getAllLeadsWithCrmDataAction();
  const initialLeads = result.success ? (result.data || []) : [];

  // Keep all leads (including won/lost) since they correspond to active columns in the Kanban board
  const activeLeads = initialLeads;

  // Fetch all CRM users for the filter dropdown
  const allUsers = await db.select().from(crmUsers);

  const currentUser = {
    id: dbUser?.id || authData.user.id,
    name: dbUser?.fullName || authData.user.email?.split("@")[0] || "Usuario",
    role: userRole,
    email: dbUser?.email || authData.user.email || ""
  };

  const initialView = searchParams.view === "list" ? "list" : "kanban";

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col w-full relative overflow-hidden">
      <PipelineClient 
        initialLeads={activeLeads}
        allCrmUsers={allUsers}
        currentUser={currentUser}
        initialView={initialView}
      />
    </div>
  );
}
