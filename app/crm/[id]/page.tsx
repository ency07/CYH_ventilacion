"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getLeadByIdAction } from "@/lib/server-actions/leads";
import { BriefcaseBusiness, Mail, Phone, MapPin, Calendar, CheckCircle2, Circle, Clock, FileText, ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";

export default function Lead360Page() {
  const { id } = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const res = await getLeadByIdAction(id as string);
        if (res.success && res.data) {
          setLead(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLead();
  }, [id]);

  if (loading) return (
    <div className="flex h-[calc(100vh-5rem)] items-center justify-center text-text-muted">
      Cargando Ficha 360°...
    </div>
  );

  if (!lead) return (
    <div className="flex h-[calc(100vh-5rem)] items-center justify-center text-red-500">
      Error: Lead no encontrado
    </div>
  );

  const tasks = lead.crmTasks || [];
  const activities = lead.crmActivityLogs || [];
  // Sort activities newest first
  const sortedActivities = [...activities].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  // Sort tasks pending first, then by date
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status === 'pendiente' && b.status === 'completado') return -1;
    if (a.status === 'completado' && b.status === 'pendiente') return 1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-5rem)] bg-bg-secondary font-sans">
      
      {/* Panel Izquierdo: Ficha Técnica */}
      <aside className="w-full lg:w-80 border-r border-border-subtle bg-bg-primary flex flex-col p-6 space-y-6">
        <Link href="/crm" className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1 w-fit transition-colors">
          <ArrowLeft className="w-3 h-3" /> Volver al Pipeline
        </Link>
        
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-accent-cyan/10 border border-accent-cyan/20 rounded-md">
              <Building2 className="w-6 h-6 text-accent-cyan" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-text-primary uppercase leading-tight">{lead.companyName}</h1>
              <p className="text-xs text-text-muted font-medium flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3"/> {lead.city}</p>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <span className={`text-[10px] px-2 py-1 rounded-sm font-bold uppercase tracking-wider border ${
              lead.riskLevel === "HOT" ? "bg-red-50 text-red-700 border-red-200" :
              lead.riskLevel === "WARM" ? "bg-amber-50 text-amber-700 border-amber-200" :
              lead.riskLevel === "SPAM" ? "bg-bg-tertiary text-text-muted border-border-subtle" :
              "bg-blue-50 text-blue-700 border-blue-200"
            }`}>
              {lead.riskLevel} LEAD
            </span>
            <span className="text-[10px] px-2 py-1 bg-bg-tertiary border border-border-subtle rounded-sm font-semibold uppercase text-text-secondary">
              Score: {lead.leadScore}
            </span>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border-subtle">
          <div>
            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Contacto Principal</h3>
            <p className="text-sm font-semibold text-text-primary">{lead.fullName}</p>
            <p className="text-xs text-text-secondary capitalize">{lead.cargo || lead.position || "Sin cargo"}</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-xs text-text-secondary flex items-center gap-2"><Mail className="w-4 h-4 text-text-muted"/> {lead.email}</p>
            <p className="text-xs text-text-secondary flex items-center gap-2"><Phone className="w-4 h-4 text-text-muted"/> {lead.phone}</p>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-border-subtle">
          <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Detalles Comerciales</h3>
          <div className="bg-bg-secondary p-3 rounded-md border border-border-subtle/50 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-muted">Estado Actual:</span>
              <span className="font-semibold text-text-primary uppercase">{lead.status.replace("_", " ")}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-muted">Servicio:</span>
              <span className="font-semibold text-text-primary capitalize">{lead.serviceType}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-muted">Valor Max:</span>
              <span className="font-bold text-emerald-600">${((lead.estimatedBudgetMax || 0) / 1000000).toFixed(1)}M</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-muted">Creación:</span>
              <span className="font-medium text-text-secondary">{new Date(lead.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Panel Central: Tareas y Timeline */}
      <main className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-text-primary tracking-wide">Panel de Seguimiento B2B</h2>
          <button className="px-4 py-2 bg-text-primary text-bg-primary text-xs font-bold uppercase tracking-wider rounded-md hover:bg-text-secondary transition-colors shadow-md">
            + Nueva Tarea
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Gestor de Tareas */}
          <section className="bg-bg-primary border border-border-subtle rounded-md p-5 shadow-sm flex flex-col h-[500px]">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-accent-cyan" />
              <h3 className="font-bold text-sm uppercase tracking-wide">Tareas Comerciales</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-border-subtle">
              {sortedTasks.length === 0 ? (
                <div className="text-xs text-text-muted text-center pt-10">No hay tareas programadas.</div>
              ) : (
                sortedTasks.map((task: any) => (
                  <div key={task.id} className={\`flex items-start gap-3 p-3 bg-bg-secondary border border-border-subtle rounded-md group transition-colors \${task.status === 'completado' ? 'opacity-60' : 'hover:border-accent-cyan/50 cursor-pointer'}\`}>
                    {task.status === 'completado' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                    ) : (
                      <Circle className="w-4 h-4 text-text-muted mt-0.5 group-hover:text-accent-cyan" />
                    )}
                    <div className="flex-1">
                      <h4 className={\`text-xs font-bold \${task.status === 'completado' ? 'text-text-secondary line-through' : 'text-text-primary'}\`}>{task.taskType}</h4>
                      {task.notes && <p className="text-[10px] text-text-secondary mt-1">{task.notes}</p>}
                      <div className="flex items-center gap-3 mt-2 text-[10px] font-semibold">
                        <span className={\`flex items-center gap-1 \${task.status === 'completado' ? 'text-text-muted' : 'text-accent-cyan'}\`}><Clock className="w-3 h-3"/> {new Date(task.dueDate).toLocaleString()}</span>
                        <span className="text-text-muted">Resp: {task.assignedTo}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Timeline Comercial */}
          <section className="bg-bg-primary border border-border-subtle rounded-md p-5 shadow-sm flex flex-col h-[500px]">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-text-muted" />
              <h3 className="font-bold text-sm uppercase tracking-wide">Actividad Comercial</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 relative scrollbar-thin scrollbar-thumb-border-subtle pl-2">
              <div className="absolute left-[13px] top-2 bottom-0 w-px bg-border-subtle"></div>
              
              {sortedActivities.length === 0 ? (
                <div className="relative pl-6 pb-6 pt-2">
                  <div className="absolute left-[-3px] top-3 w-2.5 h-2.5 rounded-full bg-border-medium border-2 border-bg-primary"></div>
                  <h4 className="text-xs font-bold text-text-primary">Lead Creado</h4>
                  <p className="text-[10px] text-text-muted mb-1">{new Date(lead.createdAt).toLocaleString()}</p>
                </div>
              ) : (
                sortedActivities.map((act: any, idx: number) => (
                  <div key={act.id} className="relative pl-6 pb-6">
                    <div className={\`absolute left-[-3px] top-1 w-2.5 h-2.5 rounded-full border-2 border-bg-primary \${idx === 0 ? 'bg-accent-cyan ring-2 ring-accent-cyan/20' : 'bg-border-medium'}\`}></div>
                    <h4 className="text-xs font-bold text-text-primary capitalize">{act.activityType.replace(/_/g, ' ')}</h4>
                    <p className="text-[10px] text-text-muted mb-1">{new Date(act.createdAt).toLocaleString()}</p>
                    <p className="text-[11px] text-text-secondary">{act.description}</p>
                    {act.activityType === 'report_generated' && (
                      <div className="mt-2 flex items-center gap-2 p-2 bg-bg-secondary border border-border-subtle rounded-md w-fit">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span className="text-[10px] font-medium">Diagnostico.pdf</span>
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Ensure "Lead Creado" is always at the bottom if activities exist */}
              {sortedActivities.length > 0 && (
                <div className="relative pl-6">
                  <div className="absolute left-[-3px] top-1 w-2.5 h-2.5 rounded-full bg-border-medium border-2 border-bg-primary"></div>
                  <h4 className="text-xs font-bold text-text-primary">Lead Creado</h4>
                  <p className="text-[10px] text-text-muted mb-1">{new Date(lead.createdAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

    </div>
  );
}
