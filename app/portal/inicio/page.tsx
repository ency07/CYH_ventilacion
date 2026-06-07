import React from "react";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { logoutAction } from "@/lib/server-actions/auth";
import { Briefcase, FileText, Settings, ShieldCheck, LogOut, Building, User } from "lucide-react";

export const metadata = {
  title: "Portal de Clientes - CYH",
  description: "Acceso exclusivo para cuentas corporativas y clientes de CYH.",
};

export default async function PortalInicioPage() {
  const supabase = getSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    redirect("/login");
  }

  // Fetch the crm_users profile
  const { data: profile } = await supabase
    .from("crm_users")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const userName = profile?.full_name || user.email?.split("@")[0] || "Cliente CYH";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Premium Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
            <Building className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-wider text-slate-100 uppercase">CYH</span>
            <span className="text-emerald-400 text-xs font-semibold block uppercase tracking-widest leading-none">Portal Industrial</span>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="hidden md:flex items-center space-x-2 bg-slate-800/40 px-3 py-1.5 rounded-full border border-slate-700/50">
            <User className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-medium text-slate-300">{userName}</span>
            <span className="bg-emerald-950 text-emerald-400 text-[10px] uppercase px-2 py-0.5 rounded-full border border-emerald-800/30 font-mono">
              Cliente
            </span>
          </div>
          
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-rose-400 bg-slate-800/30 hover:bg-rose-950/20 border border-slate-700/40 hover:border-rose-900/30 px-3 py-1.5 rounded-lg transition-all duration-300"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </button>
          </form>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 bg-emerald-950/30 text-emerald-400 text-xs px-3 py-1 rounded-full border border-emerald-500/20 mb-6 font-mono">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Acceso Seguro Autorizado</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Bienvenido a tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Portal Corporativo</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Consulte el estado de sus proyectos de ventilación mecánica, solicite asistencia técnica preventiva y acceda a la documentación autorizada para su cuenta.
          </p>
        </div>

        {/* Dynamic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Projects */}
          <div className="group relative bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 hover:border-emerald-500/30 hover:bg-slate-900/90 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/5 flex flex-col justify-between">
            <div>
              <div className="bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20 w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                <Briefcase className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-3">Proyectos Activos</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                Visualice el estado de avance de sus sistemas de climatización e ingeniería de ventilación en tiempo real.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800/80 pt-4">
                <li className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Ingeniería Detallada - En ejecución</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Suministro de Equipos - Completado</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                  <span>Montaje y Puesta en Marcha - Pendiente</span>
                </li>
              </ul>
            </div>
            <button className="mt-8 w-full bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white text-xs font-semibold py-2.5 px-4 rounded-xl border border-slate-700/60 hover:border-emerald-500/30 transition-all duration-300">
              Ver Detalles
            </button>
          </div>

          {/* Card 2: Maintenance */}
          <div className="group relative bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 hover:border-emerald-500/30 hover:bg-slate-900/90 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/5 flex flex-col justify-between">
            <div>
              <div className="bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20 w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                <Settings className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-3">Mantenimiento y Soporte</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                Programe visitas técnicas preventivas o reporte fallas operativas en sus sistemas industriales.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800/80 pt-4">
                <li className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span>Próximo preventivo: 15 de Julio, 2026</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Historial de visitas al día</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Reportes de calidad de aire descargables</span>
                </li>
              </ul>
            </div>
            <button className="mt-8 w-full bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white text-xs font-semibold py-2.5 px-4 rounded-xl border border-slate-700/60 hover:border-emerald-500/30 transition-all duration-300">
              Solicitar Asistencia
            </button>
          </div>

          {/* Card 3: Documentation */}
          <div className="group relative bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 hover:border-emerald-500/30 hover:bg-slate-900/90 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/5 flex flex-col justify-between">
            <div>
              <div className="bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20 w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-3">Planos y Fichas Técnicas</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                Consulte y descargue planos de ingeniería (CAD/BIM), memorias de cálculo y fichas técnicas de los equipos instalados.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800/80 pt-4">
                <li className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                  <span>Planos As-Built - PDF / DWG</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                  <span>Fichas Técnicas Equipos de Climatización</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                  <span>Manuales de Operación y Mantenimiento</span>
                </li>
              </ul>
            </div>
            <button className="mt-8 w-full bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white text-xs font-semibold py-2.5 px-4 rounded-xl border border-slate-700/60 hover:border-emerald-500/30 transition-all duration-300">
              Explorar Archivos
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-6 text-center text-xs text-slate-500 font-mono">
        © 2026 CYH - Ventilación Mecánica Industrial. Todos los derechos reservados.
      </footer>
    </div>
  );
}
