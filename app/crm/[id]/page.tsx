import React from "react";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { crmUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getLeadByIdAction } from "@/lib/server-actions/leads";
import LeadDetailClient from "./LeadDetailClient";
import { Shield } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function LeadDetailPage({ params }: PageProps) {
  const supabase = getSupabaseServer();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) {
    redirect("/login");
  }

  // Fetch role check from Drizzle
  const [dbUser] = await db.select().from(crmUsers).where(eq(crmUsers.id, authData.user.id));
  const userRole = dbUser?.role || "vendedor";
  const userEmail = dbUser?.email || authData.user.email || "";

  // Fetch lead data via getLeadByIdAction which has strict vendedor ownership check
  const res = await getLeadByIdAction(params.id);

  if (!res.success) {
    if (res.error.includes("Acceso denegado")) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC] p-8 text-center min-h-[500px]">
          <Shield className="w-14 h-14 text-slate-450 mb-4 animate-pulse" />
          <h2 className="text-sm font-bold text-slate-905 uppercase tracking-widest">Acceso Denegado</h2>
          <p className="text-xs text-slate-500 max-w-sm mt-2 font-semibold">
            Este lead está asignado a otro asesor comercial y no puede ser visualizado bajo su rol actual ({userRole.toUpperCase()}).
          </p>
        </div>
      );
    }
    notFound();
  }

  if (!res.data) {
    notFound();
  }

  const lead = res.data;

  const currentUser = {
    id: dbUser?.id || authData.user.id,
    name: dbUser?.fullName || authData.user.email?.split("@")[0] || "Usuario",
    role: userRole,
    email: userEmail
  };

  // Fetch all CRM users for reassignment dropdown
  const allUsers = await db.select().from(crmUsers);

  return (
    <div className="flex-1 flex flex-col w-full overflow-visible md:overflow-hidden">
      <LeadDetailClient 
        lead={lead} 
        currentUser={currentUser} 
        allCrmUsers={allUsers}
      />
    </div>
  );
}
