import React from "react";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import CrmShell from "./CrmShell";
import { ThemeProvider } from "@/components/ThemeProvider";
import { getTenantBrandingAction } from "@/lib/server-actions/config";

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Validación de sesión en servidor — bloquea acceso antes de renderizar
  const supabase = getSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    redirect("/login?from=crm");
  }

  // Obtener datos del perfil del usuario
  const { data: profile } = await supabase
    .from("crm_users")
    .select("full_name, role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) {
    redirect("/login?error=suspended");
  }

  const userName = profile.full_name || user.email?.split("@")[0] || "Usuario";
  const userEmail = user.email || "";
  const userRole = profile.role || "comercial";

  if (userRole === "cliente") {
    redirect("/portal/inicio");
  }

  // Fetch tenant branding on the server (SSR)
  const brandingRes = await getTenantBrandingAction();
  const initialBranding = brandingRes.success && brandingRes.data ? {
    companyName: brandingRes.data.config.companyName,
    logoUrl: brandingRes.data.branding.logoUrl,
    logoDarkUrl: brandingRes.data.branding.logoDarkUrl,
    primaryColor: brandingRes.data.branding.primaryColor,
    secondaryColor: brandingRes.data.branding.secondaryColor,
    btnColor: brandingRes.data.branding.btnColor,
    sidebarColor: brandingRes.data.branding.sidebarColor,
    crmConfig: brandingRes.data.branding.crmConfig,
  } : null;

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark1"
      enableSystem={false}
      storageKey="ventitech-crm-theme"
      themes={["light1", "light2", "light3", "dark1", "dark2", "dark3"]}
    >
      <CrmShell 
        userName={userName} 
        userEmail={userEmail} 
        userRole={userRole}
        initialBranding={initialBranding}
      >
        {children}
      </CrmShell>
    </ThemeProvider>
  );
}
