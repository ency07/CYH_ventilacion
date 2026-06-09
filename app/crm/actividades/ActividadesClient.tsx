"use client";

import React from "react";
import { Filter, Plus, PhoneCall, Clock, MapPin, CheckSquare, Paperclip, Link as LinkIcon } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function ActividadesClient({ activitiesData }: { activitiesData: any[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tipoParam = searchParams.get("tipo") || "todas";

  // Map URL parameter to active tab
  const getTabFromParam = (param: string) => {
    switch (param) {
      case "visita":
      case "visitas":
        return "technical_visits";
      case "llamada":
      case "llamadas":
        return "commercial_calls";
      case "reunion":
      case "reuniones":
        return "follow_up_meetings";
      case "revision":
      case "revisiones":
        return "engineering_reviews";
      default:
        return "all";
    }
  };

  const activeTab = getTabFromParam(tipoParam);

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    let value = "todas";
    if (tabId === "technical_visits") value = "visita";
    else if (tabId === "commercial_calls") value = "llamada";
    else if (tabId === "follow_up_meetings") value = "reunion";
    else if (tabId === "engineering_reviews") value = "revision";

    if (value && value !== "todas") {
      params.set("tipo", value);
    } else {
      params.delete("tipo");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  // Filtering based on activeTab
  const filteredActivities = activitiesData.filter(item => {
    if (activeTab === "all") return true;
    if (activeTab === "technical_visits") return item.task.taskType === "visita_tecnica";
    if (activeTab === "commercial_calls") return item.task.taskType === "llamada";
    if (activeTab === "follow_up_meetings") return item.task.taskType === "reunion";
    if (activeTab === "engineering_reviews") return item.task.taskType === "tarea";
    return true;
  });

  // Group by date
  const groupedByDate: { [key: string]: any[] } = {};
  
  filteredActivities.forEach(item => {
    const date = new Date(item.task.dueDate);
    const dateKey = format(date, "yyyy-MM-dd");
    if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
    groupedByDate[dateKey].push(item);
  });

  const sortedDateKeys = Object.keys(groupedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const getDayLabel = (dateString: string) => {
    const d = new Date(dateString);
    if (isToday(d)) return `Hoy, ${format(d, "d 'de' MMM", { locale: es })}`;
    if (isYesterday(d)) return `Ayer, ${format(d, "d 'de' MMM", { locale: es })}`;
    return format(d, "d 'de' MMMM, yyyy", { locale: es });
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'reunion': return <Clock className="w-4 h-4 text-purple-600" />;
      case 'llamada': return <PhoneCall className="w-4 h-4 text-blue-600" />;
      case 'visita_tecnica': return <MapPin className="w-4 h-4 text-emerald-600" />;
      default: return <CheckSquare className="w-4 h-4 text-slate-600" />;
    }
  };

  const getIconBg = (type: string) => {
    switch(type) {
      case 'reunion': return 'bg-purple-100 border-purple-200';
      case 'llamada': return 'bg-blue-100 border-blue-200';
      case 'visita_tecnica': return 'bg-emerald-100 border-emerald-200';
      default: return 'bg-slate-100 border-slate-200';
    }
  };

  const getBorderColor = (type: string) => {
    switch(type) {
      case 'visita_tecnica': return 'border-emerald-500';
      case 'reunion': return 'border-purple-400';
      case 'llamada': return 'border-blue-400';
      default: return 'border-slate-400';
    }
  };

  const getSpanishTypeName = (type: string) => {
    switch(type) {
      case 'visita_tecnica': return 'Visita Técnica';
      case 'llamada': return 'Llamada Comercial';
      case 'reunion': return 'Reunión';
      case 'tarea': return 'Revisión de Ingeniería';
      default: return 'Actividad';
    }
  };

  return (
    <div className="flex flex-col md:h-[calc(100vh-4rem)] h-auto min-h-screen md:overflow-hidden overflow-visible bg-bg-primary font-sans">
      
      {/* HEADER PRINCIPAL */}
      <div className="px-8 pt-8 pb-4 shrink-0 border-b border-border-subtle bg-bg-primary z-10 relative">
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">Historial de Actividades</h1>
            <p className="text-sm text-text-secondary mt-1">Gestión y registro de eventos operativos, visitas y revisiones.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-bg-primary border border-border-subtle rounded-md text-sm font-bold text-text-primary hover:bg-bg-secondary transition-colors shadow-sm">
              <Filter className="w-4 h-4" /> FILTRAR
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white border border-transparent rounded-md text-sm font-bold shadow-md hover:bg-opacity-90 transition-colors">
              <Plus className="w-4 h-4" /> REGISTRAR ACTIVIDAD
            </button>
          </div>
        </div>

        {/* PILLS NAVIGATION */}
        <div className="flex overflow-x-auto gap-2 no-scrollbar pb-1">
          {[
            { id: "all", label: "TODAS" },
            { id: "technical_visits", label: "VISITAS TÉCNICAS" },
            { id: "commercial_calls", label: "LLAMADAS COMERCIALES" },
            { id: "follow_up_meetings", label: "REUNIONES" },
            { id: "engineering_reviews", label: "REVISIONES DE INGENIERÍA" },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wider whitespace-nowrap transition-colors border ${
                activeTab === tab.id 
                  ? 'bg-info/20 text-text-primary border-border-medium'
                  : 'bg-bg-primary text-text-secondary border-border-subtle hover:border-text-primary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TIMELINE VIEW */}
      <div className="flex-1 md:overflow-y-auto overflow-visible px-8 py-8 bg-bg-secondary">
        <div className="max-w-5xl mx-auto">
          {sortedDateKeys.length === 0 ? (
            <div className="text-center py-20 text-text-muted text-sm">No hay actividades que coincidan con el filtro seleccionado.</div>
          ) : (
            <div className="relative">
              {/* Vertical line connecting everything */}
              <div className="absolute left-[104px] top-4 bottom-0 w-px bg-border-subtle"></div>

              {sortedDateKeys.map(dateKey => {
                const dayActivities = groupedByDate[dateKey];
                return (
                  <div key={dateKey} className="relative mb-12">
                    
                    {/* Date Label & Dot */}
                    <div className="flex items-center mb-6 relative z-10">
                      <div className="w-[90px] text-right pr-4 text-xs font-bold text-text-primary">
                        {getDayLabel(dateKey)}
                      </div>
                      <div className="w-[9px] h-[9px] bg-border-medium rounded-full ml-[6px]"></div>
                    </div>

                    {/* Day's Activities List */}
                    <div className="space-y-6">
                      {dayActivities.map(({ task, lead, companyName, environmentType }) => {
                        const statusBadgeClass = task.status === 'completado' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-info/20 text-text-primary border-border-subtle';

                        return (
                          <div key={task.id} className="relative ml-[124px]">
                            {/* Connector line to main vertical line */}
                            <div className="absolute -left-[20px] top-6 w-[20px] h-px bg-border-subtle"></div>
                            
                            <div className="bg-bg-primary rounded-md shadow-sm border border-border-subtle p-5 flex gap-4 transition-shadow hover:shadow-md relative overflow-hidden">
                              {/* Left status border */}
                              <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${getBorderColor(task.taskType)}`}></div>
                              
                              {/* Left Icon Wrapper */}
                              <div className="mt-1 shrink-0">
                                <div className={`w-10 h-10 rounded flex items-center justify-center border ${getIconBg(task.taskType)}`}>
                                  {getIcon(task.taskType)}
                                </div>
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-1 gap-4">
                                  <div>
                                    <h3 className="font-bold text-text-primary text-base truncate">
                                      {getSpanishTypeName(task.taskType)} {environmentType ? `| ${environmentType}` : ''}
                                    </h3>
                                    <p className="text-xs text-text-secondary flex items-center gap-1.5 mt-1">
                                      <FileIcon /> Cliente: {companyName || 'CYH Ventilación'}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-xs font-mono text-text-secondary">
                                      {format(new Date(task.dueDate), "hh:mm a")}
                                    </span>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${statusBadgeClass}`}>
                                      {task.status === 'completado' ? 'COMPLETADO' : 'EN PROCESO'}
                                    </span>
                                  </div>
                                </div>

                                {/* Description */}
                                <div className="mt-4 text-sm text-text-secondary leading-relaxed">
                                  {task.notes || "Actividad registrada sin detalles adicionales. Revise los documentos adjuntos para notas específicas sobre la evaluación."}
                                </div>

                                {/* Card Footer */}
                                <div className="mt-5 pt-4 border-t border-border-subtle flex items-center gap-6">
                                  {task.assignedTo ? (
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-info/20 text-text-primary flex items-center justify-center text-[10px] font-bold border border-border-medium">
                                        {task.assignedTo.substring(0,2).toUpperCase()}
                                      </div>
                                      <span className="text-xs text-text-secondary font-medium">Con {task.assignedTo}</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 text-xs text-text-primary font-medium hover:underline cursor-pointer">
                                      <LinkIcon className="w-3.5 h-3.5" />
                                      Lead #{(lead?.id || '0000').split('-')[0].substring(0,4)}
                                    </div>
                                  )}
                                  
                                  {task.taskType === 'visita_tecnica' && (
                                    <div className="flex items-center gap-1.5 text-xs text-text-secondary font-medium">
                                      <Paperclip className="w-3.5 h-3.5" />
                                      2 Adjuntos
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FileIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  );
}
