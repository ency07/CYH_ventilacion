import React from "react";
import { db } from "@/lib/db";
import { crmTasks, leads } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { CheckSquare, Circle, CheckCircle2, Clock, MapPin, Building2, User } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function TareasPage() {
  const allTasks = await db.select({
    task: crmTasks,
    leadName: leads.fullName,
    companyName: leads.companyName,
    city: leads.city
  })
  .from(crmTasks)
  .leftJoin(leads, eq(crmTasks.leadId, leads.id))
  .orderBy(desc(crmTasks.dueDate));

  const pendingTasks = allTasks.filter(t => t.task.status === 'pendiente');
  const completedTasks = allTasks.filter(t => t.task.status === 'completado');

  async function markCompleteAction(formData: FormData) {
    "use server";
    const taskId = formData.get("taskId") as string;
    await db.update(crmTasks).set({ status: 'completado', updatedAt: new Date() }).where(eq(crmTasks.id, taskId));
    revalidatePath('/crm/tareas');
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-bg-secondary p-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary uppercase tracking-wide flex items-center gap-3">
            <CheckSquare className="w-7 h-7 text-accent-cyan" /> 
            Tareas y Seguimientos
          </h1>
          <p className="text-sm text-text-muted mt-1">Checklist priorizado de actividades pendientes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-0">
        {/* Pendientes */}
        <div className="bg-bg-primary border border-border-subtle rounded-md p-6 shadow-sm flex flex-col h-full">
          <h2 className="text-sm font-bold uppercase tracking-wide text-text-primary mb-4 border-b border-border-subtle pb-3">Pendientes ({pendingTasks.length})</h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {pendingTasks.length === 0 ? (
              <p className="text-sm text-text-muted text-center pt-10">¡Todo al día! No hay tareas pendientes.</p>
            ) : (
              pendingTasks.map(({ task, leadName, companyName, city }) => (
                <div key={task.id} className="p-4 bg-bg-secondary border border-border-subtle rounded-md group hover:border-accent-cyan transition-colors">
                  <div className="flex items-start gap-3">
                    <form action={markCompleteAction}>
                      <input type="hidden" name="taskId" value={task.id} />
                      <button type="submit" className="mt-0.5 text-text-muted hover:text-emerald-500 transition-colors">
                        <Circle className="w-5 h-5" />
                      </button>
                    </form>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-text-primary text-sm uppercase">{task.taskType}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                          new Date(task.dueDate) < new Date() ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {task.notes && <p className="text-xs text-text-secondary mb-3">{task.notes}</p>}
                      
                      <div className="pt-3 mt-3 border-t border-border-subtle/50 flex items-center justify-between">
                        <Link href={`/crm/${task.leadId}`} className="flex items-center gap-2 group-hover:text-accent-cyan transition-colors">
                          <div className="p-1.5 bg-bg-primary rounded border border-border-subtle">
                            <Building2 className="w-3 h-3 text-text-muted" />
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase">{companyName || 'Sin Empresa'}</p>
                            <p className="text-[10px] text-text-muted flex items-center gap-1"><User className="w-3 h-3" /> {leadName}</p>
                          </div>
                        </Link>
                        {task.assignedTo && (
                          <span className="text-[10px] font-medium bg-bg-tertiary px-2 py-1 rounded text-text-muted border border-border-subtle">
                            Resp: {task.assignedTo}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completadas */}
        <div className="bg-bg-primary border border-border-subtle rounded-md p-6 shadow-sm flex flex-col h-full opacity-70">
          <h2 className="text-sm font-bold uppercase tracking-wide text-text-primary mb-4 border-b border-border-subtle pb-3">Completadas Recientes</h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {completedTasks.length === 0 ? (
              <p className="text-sm text-text-muted text-center pt-10">No hay tareas completadas.</p>
            ) : (
              completedTasks.map(({ task, leadName, companyName }) => (
                <div key={task.id} className="p-3 bg-bg-secondary border border-border-subtle rounded-md">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-text-secondary text-sm uppercase line-through">{task.taskType}</h3>
                      <p className="text-[10px] text-text-muted mt-1">
                        Completado • {new Date(task.updatedAt).toLocaleDateString()}
                      </p>
                      <Link href={`/crm/${task.leadId}`} className="text-[10px] text-text-secondary hover:text-accent-cyan transition-colors mt-1 inline-block">
                        {companyName} - {leadName}
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
