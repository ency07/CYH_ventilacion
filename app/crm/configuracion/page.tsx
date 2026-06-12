import React from "react";
import { getCurrentUser } from "@/lib/auth/permissions";
import { getTenantBrandingAction } from "@/lib/server-actions/config";
import { redirect } from "next/navigation";
import ConfiguracionClient from "./ConfiguracionClient";

export const metadata = {
  title: "Configuración Corporativa | CYH OS",
  description: "Panel de administración de marca, integraciones y seguridad RLS.",
};

export default async function ConfiguracionPage({ searchParams }: { searchParams?: { tab?: string } }) {
  const currentUser = await getCurrentUser();

  // Enforce administrative permissions
  if (!["admin", "super_admin", "root_dev"].includes(currentUser.role)) {
    redirect("/crm/dashboard");
  }

  const resBranding = await getTenantBrandingAction();
  const brandingData = resBranding.success && resBranding.data ? resBranding.data : null;

  return (
    <ConfiguracionClient 
      currentUser={currentUser} 
      initialBranding={brandingData} 
      initialTab={searchParams?.tab || "empresa"}
    />
  );
}
