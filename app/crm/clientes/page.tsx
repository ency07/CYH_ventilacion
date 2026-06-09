import React from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { crmCustomers, crmUsers } from "@/lib/db/schema";
import { eq, and, or, ilike } from "drizzle-orm";
import { getSupabaseServer } from "@/lib/supabase/server";
import ClientesClient from "./ClientesClient";

export const dynamic = "force-dynamic";

export default async function B2BCustomersPage({
  searchParams,
}: {
  searchParams: { q?: string; estado?: string };
}) {
  const supabase = getSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    redirect("/login");
  }

  // Retrieve details of the current logged-in user
  const { data: profile } = await supabase
    .from("crm_users")
    .select("role, email")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role || "vendedor";
  const userEmail = profile?.email || user.email || "";

  // Normalize roles
  const isAdmin = ["admin", "super_admin", "director_comercial", "director"].includes(userRole);
  const isVendedor = ["vendedor", "comercial", "asesor_comercial"].includes(userRole);
  const isTecnico = ["tecnico", "ingeniero", "tecnico_preventa"].includes(userRole);

  const query = searchParams?.q || "";
  const estado = searchParams?.estado || "activo"; // default to activo as requested (?estado=activo)

  // 1. Fetch total portfolio for KPI statistics (role-based restrictions)
  let kpiConditions = [];
  if (isVendedor) {
    kpiConditions.push(eq(crmCustomers.assignedTo, userEmail));
  }
  const kpiWhere = kpiConditions.length > 0 ? and(...kpiConditions) : undefined;

  const kpiData = await db.query.crmCustomers.findMany({
    where: kpiWhere,
    with: {
      plants: true,
    },
  });

  const kpis = {
    activeCustomers: kpiData.filter((c) => c.status === "activo").length,
    monitoredPlants: kpiData.reduce((acc, c) => acc + (c.plants?.length || 0), 0),
    commercialLtv: kpiData.reduce((acc, c) => acc + (c.ltv || 0), 0),
    recurrenceIndex:
      kpiData.length > 0
        ? Math.round(kpiData.reduce((acc, c) => acc + (c.recurrenceIndex || 0), 0) / kpiData.length)
        : 0,
  };

  // 2. Fetch filtered customer list for the high-density grid
  let conditions = [];
  if (isVendedor) {
    conditions.push(eq(crmCustomers.assignedTo, userEmail));
  }

  if (query) {
    conditions.push(
      or(
        ilike(crmCustomers.name, `%${query}%`),
        ilike(crmCustomers.nit, `%${query}%`)
      )
    );
  }

  if (estado && estado !== "all") {
    conditions.push(eq(crmCustomers.status, estado));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const customers = await db.query.crmCustomers.findMany({
    where: whereClause,
    with: {
      plants: true,
      contacts: true,
    },
    orderBy: (crmCustomers, { desc }) => [desc(crmCustomers.createdAt)],
  });

  // Fetch list of sales representatives for customer assignment forms
  const salesReps = await db.query.crmUsers.findMany({
    where: or(
      eq(crmUsers.role, "vendedor"),
      eq(crmUsers.role, "comercial"),
      eq(crmUsers.role, "director_comercial"),
      eq(crmUsers.role, "admin"),
      eq(crmUsers.role, "super_admin")
    ),
  });

  return (
    <ClientesClient
      initialCustomers={customers}
      salesReps={salesReps}
      kpis={kpis}
      userRole={userRole}
      isAdmin={isAdmin}
      isTecnico={isTecnico}
      initialQuery={query}
      initialEstado={estado}
    />
  );
}
