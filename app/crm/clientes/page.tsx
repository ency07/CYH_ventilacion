import React from "react";
import { db } from "@/lib/db";
import ClientesClient from "./ClientesClient";
import { getSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function B2BCustomersPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams?.q || "";

  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  let userRole = "comercial";
  if (user) {
    const { data: profile } = await supabase
      .from("crm_users")
      .select("role")
      .eq("id", user.id)
      .single();
    userRole = profile?.role || "comercial";
  }

  const isAdmin = ["admin", "super_admin", "director_comercial"].includes(userRole);

  const companies = await db.query.crmCompanies.findMany({
    where: query ? (fields, { ilike }) => ilike(fields.name, `%${query}%`) : undefined,
    with: {
      contacts: true,
      leads: true,
    },
    orderBy: (companies, { desc }) => [desc(companies.createdAt)],
  });

  return (
    <ClientesClient companies={companies} userRole={userRole} isAdmin={isAdmin} />
  );
}
