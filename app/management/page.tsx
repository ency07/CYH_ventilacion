import React from "react";
import { db } from "@/lib/db";
import { crmCustomers, crmUsers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Briefcase, 
  Award, 
  Layers, 
  Activity,
  ArrowUpRight,
  PieChart,
  Target
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ManagementPage() {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify executive roles (admin or root_dev)
  const dbUser = await db.query.crmUsers.findFirst({
    where: eq(crmUsers.id, user.id),
  });

  if (!dbUser || !["admin", "root_dev"].includes(dbUser.role)) {
    redirect("/portal/inicio");
  }

  // 1. Fetch all customers
  const customers = await db.query.crmCustomers.findMany({
    orderBy: [desc(crmCustomers.ltv)],
  });

  // 2. Compute aggregate BI indicators
  const totalCustomersCount = customers.length;
  
  const totalLTV = customers.reduce((sum, c) => sum + (c.ltv || 0), 0);
  
  const avgRecurrence = totalCustomersCount > 0 
    ? Math.round(customers.reduce((sum, c) => sum + (c.recurrenceIndex || 0), 0) / totalCustomersCount)
    : 0;

  // Format currencies in COP
  const formatCOP = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-300">
      
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-500/10 p-2 rounded border border-indigo-500/25">
            <PieChart className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-md font-bold uppercase tracking-wider font-mono text-white">
              Gobernanza Corporativa & BI (CYH OS)
            </h1>
            <span className="text-xs text-slate-500 font-mono">
              Panel Ejecutivo de LTV, Recurrencia y Distribución Comercial B2B
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Link 
            href="/crm/dashboard" 
            className="text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded transition-all"
          >
            Volver al CRM
          </Link>
        </div>
      </header>

      {/* Main dashboard body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-6">
        
        {/* Top BI KPI Panels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-slate-900/50 border border-slate-800/80 rounded p-5 flex flex-col justify-between min-h-[110px] shadow-sm">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-[10px] uppercase tracking-wider font-semibold font-mono">LTV Acumulado</span>
              <DollarSign className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-white block">{formatCOP(totalLTV)}</span>
              <span className="text-[11px] text-slate-500 font-mono">Total valor vitalicio de clientes</span>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded p-5 flex flex-col justify-between min-h-[110px] shadow-sm">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-[10px] uppercase tracking-wider font-semibold font-mono">Índice de Recurrencia Promedio</span>
              <Activity className="h-5 w-5 text-emerald-400 animate-pulse" />
            </div>
            <div className="mt-2">
              <span className="text-3xl font-bold font-mono tracking-tight text-emerald-400 block">{avgRecurrence}%</span>
              <span className="text-[11px] text-slate-500 font-mono">Tasa de fidelización de cuentas</span>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded p-5 flex flex-col justify-between min-h-[110px] shadow-sm">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-[10px] uppercase tracking-wider font-semibold font-mono">Cuentas Activas</span>
              <Users className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="mt-2">
              <span className="text-3xl font-bold font-mono tracking-tight text-white block">{totalCustomersCount}</span>
              <span className="text-[11px] text-slate-500 font-mono">Clientes corporativos B2B</span>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded p-5 flex flex-col justify-between min-h-[110px] shadow-sm">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-[10px] uppercase tracking-wider font-semibold font-mono">Margen de Crecimiento</span>
              <Target className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="mt-2">
              <span className="text-3xl font-bold font-mono tracking-tight text-cyan-400 block">+18.4%</span>
              <span className="text-[11px] text-slate-500 font-mono">Trimestral interanual</span>
            </div>
          </div>

        </div>

        {/* Customer Accounts Details */}
        <div className="border border-slate-800 bg-slate-900/20 rounded p-5 space-y-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-3 flex items-center justify-between">
            <span>Análisis de Cuentas Corporativas B2B</span>
            <span className="text-[10px] text-slate-500 font-mono">ORDENADO POR LTV DE MAYOR A MENOR</span>
          </h3>

          {customers.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500 font-mono">
              No hay clientes registrados para análisis en este momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-mono text-slate-500 uppercase">
                    <th className="py-2.5">NIT</th>
                    <th>Nombre de Empresa</th>
                    <th>Vendedor Asignado</th>
                    <th>LTV</th>
                    <th>Fidelidad / Recurrencia</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-900/40">
                      <td className="py-3 font-mono text-slate-400">{c.nit || "SIN NIT"}</td>
                      <td className="font-bold text-slate-100">{c.name}</td>
                      <td className="font-semibold text-slate-300">{c.assignedTo || "Sin asignar"}</td>
                      <td className="font-mono text-slate-300 font-bold">{formatCOP(c.ltv || 0)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-300">{c.recurrenceIndex || 0}%</span>
                          <div className="w-20 bg-slate-850 h-1.5 rounded-full overflow-hidden border border-slate-800">
                            <div 
                              className="bg-indigo-500 h-full rounded-full" 
                              style={{ width: `${c.recurrenceIndex || 0}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-mono border ${
                          c.status === "activo" 
                            ? "bg-emerald-950/30 text-emerald-400 border-emerald-500/20"
                            : "bg-slate-900 text-slate-400 border-slate-850"
                        }`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
