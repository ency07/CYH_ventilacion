import React from "react";
import { db } from "@/lib/db";
import { crmEmergencyWarRooms, crmUsers, crmServiceRequests, crmCustomerPlants, crmCustomers, crmWarRoomTimeline } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSupabaseServer } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { addWarRoomTimelineEventAction, resolveWarRoomAction } from "@/lib/server-actions/war-room";
import { 
  ShieldAlert, 
  Clock, 
  Users, 
  Activity, 
  Check, 
  Send, 
  Flame, 
  MapPin, 
  AlertTriangle,
  Building,
  UserCheck,
  ChevronRight,
  Sparkles
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: {
    code: string;
  };
}

export default async function WarRoomPage({ params }: PageProps) {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch user profile
  const dbUser = await db.query.crmUsers.findFirst({
    where: eq(crmUsers.id, user.id),
  });

  if (!dbUser) {
    redirect("/login");
  }

  // 2. Fetch War Room detail
  const warRoom = await db.query.crmEmergencyWarRooms.findFirst({
    where: eq(crmEmergencyWarRooms.incidentCode, params.code),
    with: {
      timeline: {
        orderBy: [desc(crmWarRoomTimeline.createdAt)],
      },
      request: {
        with: {
          customer: true,
          plant: true,
        }
      },
      leader: true,
      responsible: true,
      approver: true,
      consulted: true,
      informed: true,
    }
  });

  if (!warRoom) {
    notFound();
  }

  const isResolved = warRoom.status === "resuelto";
  const request = warRoom.request;
  const customer = request?.customer;
  const plant = request?.plant;
  const timeline = warRoom.timeline || [];

  // 3. Define Form Submission Handlers using Server Actions (via inline server action functions or simple client wrappers, let's keep it purely functional with form actions)
  async function handleAddEvent(formData: FormData) {
    "use server";
    const type = formData.get("eventType") as any;
    const desc = formData.get("description") as string;
    
    if (!desc || !type) return;

    await addWarRoomTimelineEventAction(warRoom!.id, type, desc);
    redirect(`/portal/war-room/${params.code}`);
  }

  async function handleResolve() {
    "use server";
    await resolveWarRoomAction(warRoom!.id);
    redirect(`/portal/war-room/${params.code}`);
  }

  // Calculate duration elapsed since start
  const start = new Date(warRoom.createdAt);
  const end = warRoom.resolvedAt ? new Date(warRoom.resolvedAt) : new Date();
  const diffMs = Math.abs(end.getTime() - start.getTime());
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs / (1000 * 60)) % 60);

  // RACI items list
  const raciList = [
    { role: "Leader (L)", user: warRoom.leader, desc: "Dirige la mitigación y notificaciones" },
    { role: "Responsible (R)", user: warRoom.responsible, desc: "Técnico asignado para ejecución física" },
    { role: "Approver (A)", user: warRoom.approver, desc: "Aprueba paradas de planta y firmas SAT/FAT" },
    { role: "Consulted (C)", user: warRoom.consulted, desc: "Ingeniero asesor técnico especialista" },
    { role: "Informed (I)", user: warRoom.informed, desc: "Contacto de compras y operaciones cliente" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500/30 selection:text-rose-300">
      
      {/* HEADER BANNER */}
      <div className={`border-b border-rose-900/30 px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300 ${
        isResolved 
          ? "bg-gradient-to-r from-emerald-950/40 to-slate-900/60" 
          : "bg-gradient-to-r from-rose-950/40 via-red-950/20 to-slate-900/60"
      }`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded border animate-pulse ${
            isResolved 
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}>
            {isResolved ? <Check className="h-6 w-6" /> : <Flame className="h-6 w-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-rose-600/20 border border-rose-500/30 text-rose-400 px-2 py-0.5 rounded font-mono font-bold tracking-widest uppercase">
                EMERGENCIA INDUSTRIAL
              </span>
              <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded font-mono uppercase">
                {warRoom.incidentCode}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white uppercase mt-1">
              SALA DE EMERGENCIA CRÍTICA (WAR ROOM)
            </h1>
            <div className="flex items-center gap-2 text-slate-400 text-xs mt-1.5 font-semibold font-mono">
              <Building className="h-4 w-4 shrink-0 text-slate-500" />
              <span>{customer?.name || "Cliente Corporativo"}</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-700" />
              <MapPin className="h-4 w-4 shrink-0 text-slate-500" />
              <span>{plant?.name || "Planta Industrial"}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="bg-slate-900/80 border border-slate-800 px-4 py-2.5 rounded shadow-xl flex items-center gap-3">
            <Clock className="h-5 w-5 text-rose-500" />
            <div>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono block">Tiempo Transcurrido</span>
              <span className="text-sm font-bold font-mono text-slate-100">
                {diffHours}h {diffMins}m
              </span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 px-4 py-2.5 rounded shadow-xl">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono block">Estado Operativo</span>
            <span className={`text-xs font-bold font-mono mt-0.5 block uppercase ${
              isResolved ? "text-emerald-400" : "text-rose-400 animate-pulse"
            }`}>
              {warRoom.status}
            </span>
          </div>

          {!isResolved && ["admin", "tecnico", "ingeniero"].includes(dbUser.role) && (
            <form action={handleResolve}>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded shadow-lg transition-colors border border-emerald-500/25 flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                Resolver Incidente
              </button>
            </form>
          )}
        </div>
      </div>

      {/* BODY CONTENT */}
      <div className="max-w-7xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        
        {/* LEFT COLUMN: RACI & Description */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* INCIDENT CARD */}
          <div className="border border-slate-800 bg-slate-900/20 rounded p-5 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>Descripción del Evento</span>
              <AlertTriangle className="h-4 w-4 text-rose-500 animate-bounce" />
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 font-mono block uppercase text-[10px]">Solicitud Técnica</span>
                <span className="font-bold text-slate-200 mt-1 block">{request?.title || "Falla no titulada"}</span>
              </div>
              <div>
                <span className="text-slate-500 font-mono block uppercase text-[10px]">Detalle Operativo</span>
                <p className="text-slate-400 leading-relaxed mt-1 bg-slate-950/50 p-3 rounded border border-slate-800/40">
                  {request?.description || "Sin descripción física del suceso."}
                </p>
              </div>
            </div>
          </div>

          {/* RACI MATRIX */}
          <div className="border border-slate-800 bg-slate-900/20 rounded p-5 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-slate-500" />
              <span>Matriz de Roles RACI</span>
            </h3>
            <div className="space-y-3">
              {raciList.map((item, idx) => (
                <div key={idx} className="bg-slate-950/40 border border-slate-900 p-3 rounded flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-rose-400 shrink-0">{item.role}</span>
                      <span className="text-slate-500 text-[9px] truncate">• {item.desc}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-200 block mt-1 truncate">
                      {item.user?.fullName || "No asignado / fallback general"}
                    </span>
                  </div>
                  <div className="shrink-0 bg-slate-900 p-1.5 rounded border border-slate-800">
                    <UserCheck className="h-4 w-4 text-slate-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TIMELINE & LOGGING FORM */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* EVENT LOGGING FORM */}
          {!isResolved && (
            <div className="border border-slate-800 bg-slate-900/20 rounded p-5">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-3 mb-4">
                Registrar Hito / Decisión en Bitácora
              </h3>
              <form action={handleAddEvent} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-slate-500 font-mono mb-1 uppercase font-bold text-[10px]">Tipo de Suceso</label>
                    <select
                      name="eventType"
                      className="w-full bg-slate-950 border border-slate-850 rounded px-3 py-2 text-slate-200 focus:border-slate-800 focus:outline-none"
                    >
                      <option value="evidencia">Evidencia Fotográfica / Falla</option>
                      <option value="decision">Decisión Técnica Tomada</option>
                      <option value="hito">Hito de Progreso</option>
                      <option value="comunicado">Comunicado Oficial Cliente</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-500 font-mono mb-1 uppercase font-bold text-[10px]">Descripción / Bitácora</label>
                    <textarea
                      name="description"
                      required
                      placeholder="Describa el hecho ocurrido, la decisión técnica tomada o el estado de avance..."
                      className="w-full bg-slate-950 border border-slate-850 rounded px-3 py-2 text-slate-200 placeholder-slate-700 focus:border-slate-800 focus:outline-none min-h-[50px] resize-y"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-rose-700 hover:bg-rose-600 text-white font-bold uppercase tracking-wider px-4 py-2.5 rounded transition-all border border-rose-600/30 flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Registrar Suceso
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TIMELINE VIEW */}
          <div className="border border-slate-800 bg-slate-900/20 rounded p-5 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-rose-500" />
              <span>Bitácora de Sucesos en Tiempo Real</span>
            </h3>

            {timeline.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500 font-mono">
                No hay sucesos registrados en la bitácora todavía.
              </div>
            ) : (
              <div className="relative border-l border-slate-800 pl-6 space-y-6 ml-3 py-2">
                {timeline.map((event) => {
                  let eventColor = "border-slate-700 bg-slate-800 text-slate-300";
                  if (event.eventType === "decision") eventColor = "border-amber-500 bg-amber-950/20 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.05)]";
                  else if (event.eventType === "hito") eventColor = "border-emerald-500 bg-emerald-950/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.05)]";
                  else if (event.eventType === "evidencia") eventColor = "border-cyan-500 bg-cyan-950/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.05)]";

                  return (
                    <div key={event.id} className="relative text-xs">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 ${
                        event.eventType === "decision" ? "bg-amber-500" : event.eventType === "hito" ? "bg-emerald-500" : event.eventType === "evidencia" ? "bg-cyan-500" : "bg-slate-700"
                      }`} />

                      <div className="bg-slate-950/60 border border-slate-900/80 p-4 rounded-sm space-y-2">
                        <div className="flex flex-wrap justify-between items-center gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200">{event.actorName}</span>
                            <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${eventColor}`}>
                              {event.eventType}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(event.createdAt).toLocaleDateString("es-CO", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit"
                            })}
                          </span>
                        </div>
                        <p className="text-slate-300 leading-relaxed font-sans">{event.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
