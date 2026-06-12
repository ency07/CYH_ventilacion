import React from "react";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getProfileAction } from "@/lib/server-actions/profile";
import PerfilClient from "./PerfilClient";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const supabase = getSupabaseServer();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const profileRes = await getProfileAction();
  if (!profileRes.success || !profileRes.data) redirect("/login");

  const { user, authUser: authData, auditHistory } = profileRes.data;

  return (
    <PerfilClient
      user={user as any}
      authUser={authData}
      auditHistory={auditHistory as any}
    />
  );
}
