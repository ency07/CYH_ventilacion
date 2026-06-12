import React from "react";
import { db } from "@/lib/db";
import { crmUsers, crmMediaLibrary } from "@/lib/db/schema";
import { getSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Cpu, Settings } from "lucide-react";
import { getTenantBrandingAction } from "@/lib/server-actions/config";
import ConfigForm from "./ConfigForm";

export const dynamic = "force-dynamic";

export default async function ConfigurationPage() {
  // 1. Authenticate user server-side
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Validate role requirements
  const dbUser = await db.query.crmUsers.findFirst({
    where: eq(crmUsers.id, user.id),
  });

  if (!dbUser || !["admin", "root_dev"].includes(dbUser.role)) {
    redirect("/portal/inicio");
  }

  // 3. Fetch current tenant, branding and integrations configurations
  const configResult = await getTenantBrandingAction();
  if (!configResult.success) {
    throw new Error(configResult.error || "Error al cargar la configuración de la empresa.");
  }

  const { config, branding, integrations } = configResult.data;

  // 4. Fetch last 20 records from the media library to allow selecting previous uploads
  const mediaLibrary = await db
    .select()
    .from(crmMediaLibrary)
    .orderBy(desc(crmMediaLibrary.createdAt))
    .limit(20);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-300">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-cyan-500/10 p-2 rounded border border-cyan-500/25">
            <Settings className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-md font-bold uppercase tracking-wider font-mono text-white">
              Configuración del Sistema (SaaS Engine)
            </h1>
            <span className="text-xs text-slate-500 font-mono">
              CYH OS — Personalización de Marca, Datos Corporativos e Integraciones
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Link 
            href="/ops" 
            className="text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded transition-all"
          >
            Volver a Operaciones
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8">
        <ConfigForm 
          initialConfig={config}
          initialBranding={branding}
          initialIntegrations={integrations}
          mediaLibrary={mediaLibrary}
        />
      </main>
    </div>
  );
}
