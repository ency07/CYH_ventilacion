"use client";

import React, { useState } from "react";
import { Search, Plus, Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";
import { updateTaskStatusAction } from "@/lib/server-actions/crm";

export default function TareasClient({ tasksData }: { tasksData: any[] }) {
  const [search, setSearch] = useState("");
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);

  const handleCompleteTask = async (taskId: string) => {
    try {
      setLoadingTaskId(taskId);
      const res = await updateTaskStatusAction(taskId, "completado");
      if (!res.success) {
        alert("Error al completar la tarea: " + res.error);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoadingTaskId(null);
    }
  };

  // Por diseño: Mapeo temporal de prioridades simuladas si no existe el campo en la DB.
  // Asumimos que tasksData ya viene con la data necesaria.
  const getPriority = (task: any) => {
    if (task.taskType?.toLowerCase().includes("urgente") || task.taskType?.toLowerCase().includes("diagnóstico")) return "critica";
    if (task.taskType?.toLowerCase().includes("cotización") || task.taskType?.toLowerCase().includes("propuesta")) return "alta";
    return "media";
  };

  const tasksWithPriority = tasksData.map(t => ({
    ...t,
    priority: getPriority(t.task)
  })).filter(t => t.task.status !== 'completado');

  const filteredTasks = tasksWithPriority.filter(t => 
    t.task.taskType?.toLowerCase().includes(search.toLowerCase()) || 
    t.task.notes?.toLowerCase().includes(search.toLowerCase()) ||
    t.companyName?.toLowerCase().includes(search.toLowerCase())
  );

  const critica = filteredTasks.filter(t => t.priority === "critica");
  const alta = filteredTasks.filter(t => t.priority === "alta");
  const media = filteredTasks.filter(t => t.priority === "media");

  const renderDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isPast(date) && !isToday(date)) {
      return (
        <div className="flex items-center gap-1 text-red-600 text-[11px] font-medium">
          <AlertTriangle className="w-3 h-3" />
          <span>Vencida</span>
        </div>
      );
    }
    if (isToday(date)) return <span className="text-red-600 font-bold text-[11px]">Hoy, {format(date, "HH:mm")}</span>;
    if (isTomorrow(date)) return <span className="text-text-secondary text-[11px]">Mañana</span>;
    return <span className="text-text-secondary text-[11px]">{format(date, "EEE, d MMM", { locale: es })}</span>;
  };

  const renderColumn = (title: string, priorityValue: string, items: any[]) => {
    const isCritica = priorityValue === "critica";
    const isAlta = priorityValue === "alta";
    const isMedia = priorityValue === "media";

    const dotColor = isCritica ? "bg-red-600" : isAlta ? "bg-primary" : "bg-slate-400";
    const borderColor = isCritica ? "border-red-600" : isAlta ? "border-primary" : "border-slate-400";
    const badgeBg = isCritica ? "bg-red-100" : isAlta ? "bg-blue-100" : "bg-slate-100";
    const badgeText = isCritica ? "text-red-700" : isAlta ? "text-blue-700" : "text-slate-700";

    return (
      <div className="flex-1 min-w-[320px] max-w-[400px] flex flex-col">
        {/* Column Header */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
            <h3 className="font-bold text-text-primary text-base">{title}</h3>
          </div>
          <span className="bg-surface-variant text-primary text-xs font-bold px-2 py-0.5 rounded">
            {items.length}
          </span>
        </div>

        {/* Column Cards Container */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-10 scrollbar-thin scrollbar-thumb-border-subtle">
          {items.map(({ task, leadName, companyName }, idx) => (
            <div key={task.id} className="bg-bg-primary border-y border-r border-border-subtle shadow-sm flex flex-col hover:shadow-md transition-shadow relative">
              {/* Borde izquierdo (Indicador de prioridad) */}
              <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${dotColor}`}></div>
              
              <div className="p-4 pl-5">
                {/* ID Badge & Action */}
                <div className="flex justify-between items-start mb-2">
                  <span className={`${badgeBg} ${badgeText} text-[10px] font-mono font-bold px-1.5 py-0.5 rounded`}>
                    T-{(task.id.replace(/\D/g,'') || (8000+idx).toString()).substring(0,4)}
                  </span>
                  <button 
                    onClick={() => handleCompleteTask(task.id)}
                    disabled={loadingTaskId === task.id}
                    className="p-1 hover:bg-emerald-500/10 text-text-muted hover:text-emerald-500 rounded transition-colors"
                    title="Marcar como realizada"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Title */}
                <h4 className="font-bold text-text-primary text-sm leading-tight mb-3">
                  {task.taskType} {companyName ? `- ${companyName}` : ''}
                </h4>

                {/* Divider */}
                <div className="h-px bg-border-subtle/50 w-full mb-3"></div>

                {/* Footer (Avatar & Date) */}
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-[10px] font-bold">
                      {task.assignedTo ? task.assignedTo.substring(0,2).toUpperCase() : 'CY'}
                    </div>
                    <span className="text-xs text-text-secondary font-medium">
                      {task.assignedTo || 'Tú'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-text-muted" />
                    {renderDate(task.dueDate)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {items.length === 0 && (
            <div className="p-4 border border-dashed border-border-subtle rounded-md text-center text-xs text-text-muted">
              Columna vacía
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4 shrink-0 px-8 pt-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Gestión de Tareas</h1>
          <p className="text-sm text-text-secondary mt-1">Monitoreo de actividades operativas e ingeniería.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Buscar tarea..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-bg-primary border border-border-subtle rounded-md w-64 focus:outline-none focus:border-accent-cyan shadow-sm" 
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white border border-transparent rounded-md text-sm font-bold shadow-md hover:bg-opacity-90 transition-colors">
            <Plus className="w-4 h-4" /> Nueva Tarea
          </button>
        </div>
      </div>

      {/* KANBAN BOARD */}
      <div className="flex-1 flex overflow-x-auto gap-6 px-8 pb-8">
        {renderColumn("Prioridad Crítica", "critica", critica)}
        {renderColumn("Prioridad Alta", "alta", alta)}
        {renderColumn("Prioridad Media", "media", media)}
      </div>

    </div>
  );
}
