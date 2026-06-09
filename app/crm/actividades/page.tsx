import React, { Suspense } from "react";
import { db } from "@/lib/db";
import { crmTasks, leads, crmCompanies, crmCustomers, crmPipeline, crmUsers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getLeadsForSelectAction } from "@/lib/server-actions/crm";
import ActividadesClient from "./ActividadesClient";

export const dynamic = "force-dynamic";

export default async function ActividadesPage() {
  const supabase = getSupabaseServer();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) {
    redirect("/login");
  }

  const [dbUser] = await db.select().from(crmUsers).where(eq(crmUsers.id, authData.user.id));
  if (!dbUser) {
    redirect("/login");
  }

  const currentUser = {
    id: dbUser.id,
    name: dbUser.fullName || authData.user.email?.split("@")[0] || "Usuario",
    role: dbUser.role,
    email: dbUser.email
  };

  const query = db.select({
    task: crmTasks,
    lead: { id: leads.id },
    companyName: crmCompanies.name,
    customerName: crmCustomers.name,
    environmentType: leads.environmentType,
  })
  .from(crmTasks)
  .leftJoin(leads, eq(crmTasks.leadId, leads.id))
  .leftJoin(crmCompanies, eq(leads.companyId, crmCompanies.id))
  .leftJoin(crmCustomers, eq(crmCompanies.name, crmCustomers.name))
  .leftJoin(crmPipeline, eq(leads.id, crmPipeline.leadId));

  let filteredQuery = query;
  if (currentUser.role === "tecnico" || currentUser.role === "ingeniero") {
    filteredQuery = query.where(eq(crmTasks.assignedTo, currentUser.email)) as any;
  } else if (currentUser.role === "comercial" || currentUser.role === "vendedor" || currentUser.role === "asesor_comercial") {
    filteredQuery = query.where(eq(crmPipeline.assignedTo, currentUser.email)) as any;
  }

  const allTasks = await filteredQuery.orderBy(desc(crmTasks.dueDate));

  // Map to guarantee fallback values
  const mappedTasks = allTasks.map((t: any) => ({
    ...t,
    companyName: t.companyName || t.customerName || "Proyecto CYH",
  }));

  // Leads para el dropdown del modal
  const leadsRes = await getLeadsForSelectAction();
  const leadsForSelect = leadsRes.success ? leadsRes.data : [];

  return (
    <div className="w-full">
      <Suspense fallback={<div className="p-8 text-center animate-pulse text-text-muted">Cargando Historial...</div>}>
        <ActividadesClient
          activitiesData={mappedTasks}
          leadsForSelect={leadsForSelect}
          userRole={currentUser.role}
        />
      </Suspense>
    </div>
  );
}
