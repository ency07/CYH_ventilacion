import React from "react";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import CrmShell from "./CrmShell";

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Validación de sesión en servidor — bloquea acceso antes de renderizar
  const supabase = getSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    redirect("/login");
  }

  // Obtener datos del perfil del usuario
  const { data: profile } = await supabase
    .from("crm_users")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const userName = profile?.full_name || user.email?.split("@")[0] || "Usuario";
  const userEmail = user.email || "";
  const userRole = profile?.role || "comercial";

  if (userRole === "cliente") {
    redirect("/portal/inicio");
  }

  return (
    <CrmShell userName={userName} userEmail={userEmail} userRole={userRole}>
      {children}
    </CrmShell>
  );
}
