"use client";

import React, { useState } from "react";
import { Filter, Plus, PhoneCall, Clock, MapPin, CheckSquare, Paperclip, Link as LinkIcon } from "lucide-react";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

export default function ActividadesClient({ activitiesData }: { activitiesData: any[] }) {
  const [activeTab, setActiveTab] = useState("all");

  // Filtering based on tab
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
    // using dueDate or createdAt as the activity date
    const date = new Date(item.task.dueDate);
    const dateKey = format(date, "yyyy-MM-dd");
    if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
    groupedByDate[dateKey].push(item);
  });

  const sortedDateKeys = Object.keys(groupedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const getDayLabel = (dateString: string) => {
    const d = new Date(dateString);
    if (isToday(d)) return `Today, ${format(d, "MMM d")}`;
    if (isYesterday(d)) return `Yesterday, ${format(d, "MMM d")}`;
    return format(d, "MMM d, yyyy");
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
      case 'visita_tecnica': return 'border-text-primary';
      case 'reunion': return 'border-purple-300';
      case 'llamada': return 'border-blue-300';
      default: return 'border-slate-300';
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-primary overflow-hidden font-sans">
      
      {/* HEADER PRINCIPAL */}
      <div className="px-8 pt-8 pb-4 shrink-0 border-b border-border-subtle bg-bg-primary z-10 relative">
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">Activities Tracking</h1>
            <p className="text-sm text-text-secondary mt-1">Manage and log operational events, visits, and reviews.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-bg-primary border border-border-subtle rounded-md text-sm font-bold text-text-primary hover:bg-bg-secondary transition-colors shadow-sm">
              <Filter className="w-4 h-4" /> FILTER
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white border border-transparent rounded-md text-sm font-bold shadow-md hover:bg-opacity-90 transition-colors">
              <Plus className="w-4 h-4" /> LOG ACTIVITY
            </button>
          </div>
        </div>

        {/* PILLS NAVIGATION */}
        <div className="flex overflow-x-auto gap-2 no-scrollbar pb-1">
          {[
            { id: "all", label: "ALL ACTIVITIES" },
            { id: "technical_visits", label: "TECHNICAL VISITS" },
            { id: "commercial_calls", label: "COMMERCIAL CALLS" },
            { id: "follow_up_meetings", label: "FOLLOW-UP MEETINGS" },
            { id: "engineering_reviews", label: "ENGINEERING REVIEWS" },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
      <div className="flex-1 overflow-y-auto px-8 py-8 bg-bg-secondary">
        <div className="max-w-5xl mx-auto">
          {sortedDateKeys.length === 0 ? (
            <div className="text-center py-20 text-text-muted text-sm">No activities match the selected filter.</div>
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
                      {dayActivities.map(({ task, lead, companyName }) => {
                        const statusBadgeClass = task.status === 'completado' 
                          ? 'bg-info/10 text-text-primary border-border-subtle'
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
                                      {task.title || (task.taskType === 'visita_tecnica' ? 'Site Inspection' : task.taskType.toUpperCase())}
                                    </h3>
                                    <p className="text-xs text-text-secondary flex items-center gap-1.5 mt-1">
                                      <FileIcon /> Client: {companyName || 'Unknown'}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-xs font-mono text-text-secondary">
                                      {format(new Date(task.dueDate), "HH:mm a")}
                                    </span>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${statusBadgeClass}`}>
                                      {task.status === 'completado' ? 'COMPLETED' : 'IN PROGRESS'}
                                    </span>
                                  </div>
                                </div>

                                {/* Description */}
                                <div className="mt-4 text-sm text-text-secondary leading-relaxed">
                                  {task.notes || "Activity logged without additional details. Review attached documents for specific notes on the assessment."}
                                </div>

                                {/* Card Footer */}
                                <div className="mt-5 pt-4 border-t border-border-subtle flex items-center gap-6">
                                  {task.assignedTo ? (
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-info/20 text-text-primary flex items-center justify-center text-[10px] font-bold border border-border-medium">
                                        {task.assignedTo.substring(0,2).toUpperCase()}
                                      </div>
                                      <span className="text-xs text-text-secondary font-medium">With {task.assignedTo} (Lead Eng)</span>
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
                                      2 Attachments
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

// Pequeño componente auxiliar para el icono de documento en el subtítulo
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
