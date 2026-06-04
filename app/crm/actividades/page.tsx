import React from "react";
import { db } from "@/lib/db";
import { crmTasks, leads, crmCompanies } from "@/lib/db/schema";
import { PhoneCall, CheckSquare, Clock, MapPin, Search, Filter } from "lucide-react";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function ActividadesPage() {
  const allTasks = await db.select({
    task: crmTasks,
    lead: { id: leads.id },
    companyName: crmCompanies.name,
  })
  .from(crmTasks)
  .leftJoin(leads, eq(crmTasks.leadId, leads.id))
  .leftJoin(crmCompanies, eq(leads.companyId, crmCompanies.id))
  .orderBy(desc(crmTasks.dueDate));

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-bg-secondary p-8 font-sans overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary uppercase tracking-wide flex items-center gap-3">
            <PhoneCall className="w-7 h-7 text-accent-cyan" /> 
            Registro de Actividades
          </h1>
          <p className="text-sm text-text-muted mt-1">Historial completo de llamadas, correos, reuniones y tareas.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-bg-primary border border-border-subtle rounded-md text-sm font-bold text-text-secondary hover:text-text-primary hover:border-accent-cyan transition-colors">
            <Filter className="w-4 h-4" /> Filtros
          </button>
        </div>
      </div>

      <div className="flex-1 bg-bg-primary border border-border-subtle rounded-md shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border-subtle bg-bg-secondary flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Buscar por cliente, título..." 
              className="w-full bg-bg-primary border border-border-subtle rounded-md pl-10 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-cyan"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-bg-secondary sticky top-0">
              <tr>
                <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle">Tipo</th>
                <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle">Título / Cliente</th>
                <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle">Fecha</th>
                <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle">Asignado a</th>
                <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {allTasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-sm text-text-muted">No hay actividades registradas.</td>
                </tr>
              ) : (
                allTasks.map(({ task, lead, companyName }) => (
                  <tr key={task.id} className="hover:bg-bg-secondary/50 transition-colors group">
                    <td className="p-4">
                      <div className={`p-2 rounded w-fit ${
                        task.taskType === 'reunion' ? 'bg-blue-500/10 text-blue-500' :
                        task.taskType === 'llamada' ? 'bg-amber-500/10 text-amber-500' :
                        task.taskType === 'visita_tecnica' ? 'bg-purple-500/10 text-purple-500' :
                        'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {task.taskType === 'reunion' && <Clock className="w-5 h-5" />}
                        {task.taskType === 'llamada' && <PhoneCall className="w-5 h-5" />}
                        {task.taskType === 'visita_tecnica' && <MapPin className="w-5 h-5" />}
                        {task.taskType === 'tarea' && <CheckSquare className="w-5 h-5" />}
                      </div>
                    </td>
                    <td className="p-4">
                      <Link href={`/crm/${lead?.id}`} className="font-bold text-text-primary text-sm uppercase hover:text-accent-cyan block">
                        {task.title}
                      </Link>
                      <span className="text-[11px] text-text-secondary">{companyName || 'Lead sin empresa'}</span>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-bold text-text-primary">
                        {format(new Date(task.dueDate), "dd MMM, yyyy", { locale: es })}
                      </p>
                      <p className="text-[10px] uppercase text-text-muted mt-0.5">
                        {format(new Date(task.dueDate), "HH:mm")}
                      </p>
                    </td>
                    <td className="p-4 text-sm text-text-secondary">
                      {task.assignedTo || 'Sin asignar'}
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${
                        task.status === 'completado' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                        task.status === 'en_progreso' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 
                        'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
