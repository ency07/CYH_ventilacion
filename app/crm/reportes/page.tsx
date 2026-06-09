import React, { Suspense } from "react";
import { db } from "@/lib/db";
import { crmUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import ReportesClient from "./ReportesClient";
import { getReportsMetricsAction } from "@/lib/server-actions/crm";

export const dynamic = "force-dynamic";

export default async function ReportesPage({ searchParams }: { searchParams: { periodo?: string } }) {
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

  const periodo = searchParams?.periodo || "90dias";
  const res = await getReportsMetricsAction(periodo);
  const metrics = res.success ? res.data : null;

  return (
    <div className="w-full">
      <ReportesClient initialData={metrics} currentUser={currentUser} />
    </div>
  );
}
