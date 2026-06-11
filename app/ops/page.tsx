import React from "react";
import { db } from "@/lib/db";
import { crmAssets, crmCustomerPlants, crmCustomers, crmWorkOrders, crmEmergencyWarRooms, crmUsers } from "@/lib/db/schema";
import { eq, ne, desc } from "drizzle-orm";
import { getSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  Activity, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Building, 
  MapPin, 
  Zap, 
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  Cpu
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OpsPage() {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify internal roles (admin, tecnico, ingeniero)
  const dbUser = await db.query.crmUsers.findFirst({
    where: eq(crmUsers.id, user.id),
  });

  if (!dbUser || !["admin", "tecnico", "ingeniero", "root_dev"].includes(dbUser.role)) {
    redirect("/portal/inicio");
  }

  // 1. Fetch assets with their plant and customer
  const assets = await db.query.crmAssets.findMany({
    with: {
      plant: {
        with: {
          customer: true,
        }
      }
    },
    orderBy: [desc(crmAssets.createdAt)],
  });

  // 2. Fetch pending work orders
  const pendingOrders = await db.query.crmWorkOrders.findMany({
    where: ne(crmWorkOrders.status, "completado"),
    with: {
      asset: {
        with: {
          plant: {
            with: {
              customer: true,
            }
          }
        }
      }
    },
    orderBy: [desc(crmWorkOrders.createdAt)],
  });

  // 3. Fetch active war rooms
  const activeWarRooms = await db.query.crmEmergencyWarRooms.findMany({
    where: eq(crmEmergencyWarRooms.status, "activo"),
    with: {
      request: {
        with: {
          customer: true,
          plant: true,
        }
      }
    },
    orderBy: [desc(crmEmergencyWarRooms.createdAt)],
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-300">
      
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-cyan-500/10 p-2 rounded border border-cyan-500/25">
            <Cpu className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-md font-bold uppercase tracking-wider font-mono text-white">
              Centro de Control de Operaciones (IOS)
            </h1>
            <span className="text-xs text-slate-500 font-mono">
              CYH OS — Telemetría en Tiempo Real e Integración CMMS
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
        
        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-slate-900/50 border border-slate-800/80 rounded p-5 flex flex-col justify-between min-h-[110px] shadow-sm">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-[10px] uppercase tracking-wider font-semibold font-mono">Total Activos Monitoreados</span>
              <Settings className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="mt-2">
              <span className="text-3xl font-bold font-mono tracking-tight text-white block">{assets.length}</span>
              <span className="text-[11px] text-slate-500 font-mono">En operaciones industriales</span>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded p-5 flex flex-col justify-between min-h-[110px] shadow-sm">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-[10px] uppercase tracking-wider font-semibold font-mono">Salas de Emergencia (War Rooms)</span>
              <ShieldAlert className="h-5 w-5 text-rose-500 animate-pulse" />
            </div>
            <div className="mt-2">
              <span className="text-3xl font-bold font-mono tracking-tight text-rose-400 block">{activeWarRooms.length}</span>
              <span className="text-[11px] text-slate-500 font-mono">Incidentes críticos activos</span>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded p-5 flex flex-col justify-between min-h-[110px] shadow-sm">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-[10px] uppercase tracking-wider font-semibold font-mono">OTs Pendientes (CMMS)</span>
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div className="mt-2">
              <span className="text-3xl font-bold font-mono tracking-tight text-amber-400 block">{pendingOrders.length}</span>
              <span className="text-[11px] text-slate-500 font-mono">Mantenimiento preventivo/correctivo</span>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded p-5 flex flex-col justify-between min-h-[110px] shadow-sm">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-[10px] uppercase tracking-wider font-semibold font-mono">Eficiencia de Operaciones</span>
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="mt-2">
              <span className="text-3xl font-bold font-mono tracking-tight text-emerald-400 block">97.8%</span>
              <span className="text-[11px] text-slate-500 font-mono">SLA de respuesta cumplido</span>
            </div>
          </div>

        </div>

        {/* Dashboard Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Assets Table Section */}
          <div className="lg:col-span-2 border border-slate-800 bg-slate-900/20 rounded p-5 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>Inventario Global de Activos y Estado</span>
              <span className="text-[10px] text-slate-500 font-mono">ORDENADO POR FECHA DE CREACIÓN</span>
            </h3>

            {assets.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500 font-mono">
                No hay activos de ventilación registrados en el sistema.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] font-mono text-slate-500 uppercase">
                      <th className="py-2.5">Código</th>
                      <th>Equipo</th>
                      <th>Cliente / Planta</th>
                      <th>Uso</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {assets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-slate-900/40">
                        <td className="py-3 font-mono font-bold text-slate-300">{asset.code}</td>
                        <td className="font-semibold text-slate-100">{asset.name}</td>
                        <td>
                          <span className="block font-semibold text-slate-300">{asset.plant?.customer?.name || "Cliente general"}</span>
                          <span className="text-[10px] text-slate-500 block">{asset.plant?.name}</span>
                        </td>
                        <td className="font-mono text-slate-300">{asset.operatingHours.toLocaleString("es-CO")} hrs</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-mono border ${
                            asset.status === "operativo" 
                              ? "bg-emerald-950/30 text-emerald-400 border-emerald-500/20"
                              : "bg-amber-950/30 text-amber-400 border-amber-500/20"
                          }`}>
                            {asset.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right sidebar: War Rooms and OTs */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* ACTIVE WAR ROOMS */}
            <div className="border border-slate-800 bg-slate-900/20 rounded p-5 space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-3 flex items-center justify-between">
                <span>Incidentes Activos (War Rooms)</span>
                <span className="text-[10px] bg-rose-950/30 border border-rose-500/25 text-rose-400 px-2 py-0.5 rounded font-mono animate-pulse">ALERTA P1</span>
              </h3>

              {activeWarRooms.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 font-mono">
                  No hay incidentes de parada crítica activos.
                </div>
              ) : (
                <div className="space-y-3">
                  {activeWarRooms.map((wr) => (
                    <div key={wr.id} className="bg-slate-950 border border-slate-900 p-3.5 rounded flex items-center justify-between gap-4">
                      <div>
                        <span className="font-mono text-xs font-bold text-rose-400 block">{wr.incidentCode}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 max-w-[180px] truncate">{wr.request?.title}</span>
                        <span className="text-[9px] text-slate-500 font-mono block mt-1">{wr.request?.customer?.name}</span>
                      </div>
                      <Link
                        href={`/portal/war-room/${wr.incidentCode}`}
                        className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 p-1.5 rounded transition-colors"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PENDING WORK ORDERS */}
            <div className="border border-slate-800 bg-slate-900/20 rounded p-5 space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-3">
                Órdenes de Trabajo Pendientes
              </h3>

              {pendingOrders.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 font-mono">
                  No hay órdenes de mantenimiento en cola.
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {pendingOrders.map((order) => (
                    <div key={order.id} className="bg-slate-950/60 border border-slate-900 p-3 rounded text-xs space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-200 block truncate max-w-[160px]">{order.title}</span>
                        <span className="text-[9px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800 font-mono uppercase">
                          {order.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>{order.asset?.code}</span>
                        <span>{new Date(order.scheduledDate).toLocaleDateString("es-CO")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
