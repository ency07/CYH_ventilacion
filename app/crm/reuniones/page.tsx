import React from "react";
import { db } from "@/lib/db";
import { crmTasks, leads, crmCompanies } from "@/lib/db/schema";
import { eq, inArray, desc } from "drizzle-orm";
import { Handshake, Calendar, CheckCircle2, Clock, Search, MapPin, User, CheckSquare } from "lucide-react";
import Link from "next/link";
import { format, isPast, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ReunionesPage() {
  const allMeetings = await db.select({
    task: crmTasks,
    lead: {
      id: leads.id,
      fullName: leads.fullName,
      status: leads.status,
    },
    companyName: crmCompanies.name
  })
  .from(crmTasks)
  .leftJoin(leads, eq(crmTasks.leadId, leads.id))
  .leftJoin(crmCompanies, eq(leads.companyId, crmCompanies.id))
  .where(inArray(crmTasks.taskType, ['reunion', 'visita_tecnica']))
  .orderBy(desc(crmTasks.dueDate));

  const pendientes = allMeetings.filter(m => m.task.status === 'pendiente');
  const pasadas = allMeetings.filter(m => m.task.status === 'completado');

  async function completarReunion(formData: FormData) {
    "use server";
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const taskId = formData.get("taskId") as string;
    await db.update(crmTasks).set({ status: 'completado', updatedAt: new Date() }).where(eq(crmTasks.id, taskId));
    revalidatePath('/crm/reuniones');
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-bg-secondary p-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary uppercase tracking-wide flex items-center gap-3">
            <Handshake className="w-7 h-7 text-accent-cyan" /> 
            Reuniones y Visitas Técnicas
          </h1>
          <p className="text-sm text-text-muted mt-1">Levantamiento de actas, agenda de campo y compromisos comerciales.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-0">
        
        {/* Columna Pendientes */}
        <div className="bg-bg-primary border border-border-subtle rounded-md p-6 shadow-sm flex flex-col h-full">
          <h2 className="text-sm font-bold uppercase tracking-wide text-text-primary mb-4 border-b border-border-subtle pb-3 flex items-center justify-between">
            <span>Próximas y Pendientes</span>
            <span className="bg-accent-cyan text-bg-primary px-2 py-0.5 rounded-full text-xs font-bold">{pendientes.length}</span>
          </h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {pendientes.length === 0 ? (
              <p className="text-sm text-text-muted text-center pt-10">No tienes reuniones programadas.</p>
            ) : (
              pendientes.map(({ task, lead, companyName }) => {
                const date = new Date(task.dueDate);
                const isOverdue = isPast(date) && !isToday(date);
                return (
                  <div key={task.id} className={`p-4 bg-bg-secondary border rounded-md relative ${isOverdue ? 'border-red-500/30' : 'border-border-subtle'}`}>
                    {isOverdue && <span className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded">VENCIDA</span>}
                    <div className="flex gap-4">
                      <div className={`flex flex-col items-center justify-center p-3 rounded-md w-16 h-16 ${task.taskType === 'visita_tecnica' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        <span className="text-xs font-bold uppercase">{format(date, 'MMM', { locale: es })}</span>
                        <span className="text-xl font-display font-bold">{format(date, 'dd')}</span>
                      </div>
                      <div className="flex-1">
                        <Link href={`/crm/${lead?.id}`} className="font-bold text-text-primary uppercase text-sm hover:text-accent-cyan transition-colors">
                          {companyName || lead?.fullName || 'Desconocido'}
                        </Link>
                        <h4 className="text-xs font-bold text-text-secondary mt-1">{task.taskType === 'visita_tecnica' ? 'Visita Técnica / Campo' : 'Reunión Comercial'}</h4>
                        {task.notes && <p className="text-[11px] text-text-muted mt-1 italic">"{task.notes}"</p>}
                        
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border-subtle">
                          <span className="flex items-center gap-1 text-[10px] text-text-muted uppercase font-bold"><Clock className="w-3 h-3" /> {format(date, 'HH:mm')}</span>
                          <span className="flex items-center gap-1 text-[10px] text-text-muted uppercase font-bold"><User className="w-3 h-3" /> {lead?.fullName}</span>
                        </div>
                      </div>
                    </div>
                    
                    <form action={completarReunion} className="mt-4">
                      <input type="hidden" name="taskId" value={task.id} />
                      <button type="submit" className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 rounded transition-colors text-xs font-bold uppercase">
                        <CheckSquare className="w-4 h-4" /> Marcar como Realizada / Redactar Acta
                      </button>
                    </form>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Columna Completadas */}
        <div className="bg-bg-primary border border-border-subtle rounded-md p-6 shadow-sm flex flex-col h-full opacity-80">
          <h2 className="text-sm font-bold uppercase tracking-wide text-text-primary mb-4 border-b border-border-subtle pb-3">Historial de Reuniones</h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {pasadas.length === 0 ? (
              <p className="text-sm text-text-muted text-center pt-10">No hay reuniones en el historial.</p>
            ) : (
              pasadas.map(({ task, lead, companyName }) => (
                <div key={task.id} className="p-3 bg-bg-secondary border border-border-subtle rounded-md flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-text-secondary text-sm uppercase line-through">{companyName}</h3>
                    <p className="text-[10px] text-text-muted flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" /> {format(new Date(task.dueDate), 'dd MMM yyyy, HH:mm')}
                    </p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500/50" />
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
