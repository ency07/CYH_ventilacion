"use client";

import React, { useState, useEffect } from "react";
import { 
  getDashboardMetricsAction, 
  getAllLeadsWithCrmDataAction, 
  updateLeadStatusAction 
} from "@/lib/server-actions/crm";
import { 
  Target,
  DollarSign,
  TrendingUp,
  Clock,
  Search,
  Filter,
  FolderKanban,
  ArrowRight,
  FileText
} from "lucide-react";
import Link from "next/link";

const STAGES = [
  { id: "nuevo", name: "Nuevo Lead", bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", prob: 10 },
  { id: "contacto", name: "Contacto Inicial", bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", prob: 20 },
  { id: "reunion", name: "Reunión Agendada", bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", prob: 30 },
  { id: "diagnostico", name: "Diagnóstico", bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", prob: 40 },
  { id: "propuesta_prep", name: "Prop. en Prep.", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", prob: 50 },
  { id: "propuesta_entregada", name: "Prop. Entregada", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", prob: 60 },
  { id: "negociacion", name: "Negociación", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", prob: 80 },
  { id: "ganado", name: "Proy. Ganado", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", prob: 100 },
];

export default function CrmDashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedOverStage, setDraggedOverStage] = useState<string | null>(null);

  // FASE 5.2: Búsqueda y Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("all");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const metricsRes = await getDashboardMetricsAction();
      const leadsRes = await getAllLeadsWithCrmDataAction();
      
      if (!metricsRes.success) throw new Error(metricsRes.error);
      if (!leadsRes.success) throw new Error(leadsRes.error);
      
      setMetrics(metricsRes.data);
      setLeads(leadsRes.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al recargar el CRM.");
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("text/plain", leadId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDraggedOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDraggedOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    setDraggedOverStage(null);
    const leadId = e.dataTransfer.getData("text/plain");
    if (!leadId) return;

    const previousLeads = [...leads];
    const updatedLeads = leads.map(l => l.id === leadId ? { ...l, status: targetStage } : l);
    setLeads(updatedLeads);

    try {
      const res = await updateLeadStatusAction(leadId, targetStage);
      if (!res.success) throw new Error(res.error || "Fallo al actualizar etapa.");
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(`Error comercial: No se pudo mover el lead.\n${err.message}`);
      setLeads(previousLeads);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4 font-sans text-sm text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
        <p>Cargando plataforma comercial...</p>
      </div>
    );
  }

  // --- Dynamic B2B KPIs ---
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const openLeads = leads.filter(l => l.status !== "ganado" && l.status !== "perdido");
  const wonLeads = leads.filter(l => l.status === "ganado");
  const proposalsSent = leads.filter(l => l.status === "propuesta_entregada" || l.status === "negociacion" || l.status === "ganado").length;
  const activeNegotiations = leads.filter(l => l.status === "negociacion").length;
  
  const leadsThisMonth = leads.filter(l => {
    const d = new Date(l.createdAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  let weightedPipelineValue = 0;
  openLeads.forEach(l => {
    const stageConf = STAGES.find(s => s.id === l.status);
    const prob = stageConf ? stageConf.prob : 10;
    weightedPipelineValue += (l.estimatedBudgetMax || 0) * (prob / 100);
  });

  let avgDaysToClose = 0;
  if (wonLeads.length > 0) {
    const totalDays = wonLeads.reduce((acc, lead) => {
      const created = new Date(lead.createdAt).getTime();
      const updated = new Date(lead.updatedAt).getTime();
      return acc + (updated - created) / (1000 * 60 * 60 * 24);
    }, 0);
    avgDaysToClose = Math.round(totalDays / wonLeads.length);
  }

  return (
    <div className="w-full px-4 md:px-6 py-6 flex flex-col space-y-6 bg-slate-50 font-sans text-slate-800 h-full">
      
      {/* HEADER & FILTROS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Pipeline Comercial
          </h1>
          <p className="text-slate-500 text-xs mt-1">Gestión B2B Enterprise de CYH Ingeniería.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Barra de Búsqueda */}
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar empresa o contacto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 w-full border border-slate-300 rounded-md text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Filtro Asesor */}
          <div className="relative w-full sm:w-40">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-slate-400" />
            </div>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="pl-9 pr-3 py-1.5 w-full border border-slate-300 rounded-md text-xs text-slate-800 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none"
            >
              <option value="all">Todos los Asesores</option>
              <option value="me">Asignados a Mí</option>
              <option value="unassigned">Sin Asignar</option>
            </select>
          </div>

          <button 
            onClick={fetchData}
            className="px-4 py-1.5 border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-md transition-colors shadow-sm whitespace-nowrap"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* 4 ADVANCED KPIs Requeridos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 p-3 rounded-md shadow-sm border-l-4 border-l-amber-500">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <Clock className="w-3.5 h-3.5" />
            <h3 className="text-[10px] font-bold uppercase tracking-wider">Leads sin contacto</h3>
          </div>
          <p className="text-lg font-bold text-slate-900">{leads.filter(l => l.status === "nuevo").length}</p>
        </div>

        <div className="bg-white border border-slate-200 p-3 rounded-md shadow-sm border-l-4 border-l-red-500">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <Target className="w-3.5 h-3.5" />
            <h3 className="text-[10px] font-bold uppercase tracking-wider">Tareas Vencidas</h3>
          </div>
          <p className="text-lg font-bold text-slate-900">{leads.filter(l => l.status !== "ganado" && l.status !== "perdido" && new Date(l.updatedAt).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000).length}</p>
        </div>

        <div className="bg-white border border-slate-200 p-3 rounded-md shadow-sm border-l-4 border-l-blue-500">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <FolderKanban className="w-3.5 h-3.5" />
            <h3 className="text-[10px] font-bold uppercase tracking-wider">Reuniones Próximas</h3>
          </div>
          <p className="text-lg font-bold text-slate-900">{leads.filter(l => l.status === "reunion").length}</p>
        </div>

        <div className="bg-white border border-slate-200 p-3 rounded-md shadow-sm border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <DollarSign className="w-3.5 h-3.5" />
            <h3 className="text-[10px] font-bold uppercase tracking-wider">Forecast Comercial</h3>
          </div>
          <p className="text-lg font-bold text-slate-900">${(weightedPipelineValue / 1000000).toFixed(1)}M</p>
        </div>
      </div>

      {/* KANBAN BOARD COMPACTO */}
      <div className="w-full flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-2 min-w-max h-full min-h-[400px]">
          {STAGES.map((stage) => {
            // FASE 5.2: Apply Search and Filter
            let stageLeads = leads.filter(l => l.status === stage.id);
            
            if (debouncedSearchTerm) {
              const lower = debouncedSearchTerm.toLowerCase();
              stageLeads = stageLeads.filter(l => 
                l.companyName?.toLowerCase().includes(lower) || 
                l.fullName?.toLowerCase().includes(lower) ||
                l.city?.toLowerCase().includes(lower)
              );
            }

            if (filterAssignee === "unassigned") {
              stageLeads = stageLeads.filter(l => !l.assignedTo || l.assignedTo.trim() === "");
            } else if (filterAssignee === "me") {
              // TODO: Auth context check. For now, let's assume 'Admin' or use a fixed name.
              stageLeads = stageLeads.filter(l => l.assignedTo === "Admin");
            }

            const isDraggedOver = draggedOverStage === stage.id;
            const colValue = stageLeads.reduce((acc, l) => acc + (l.estimatedBudgetMax || 0), 0);

            return (
              <div
                key={stage.id}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.id)}
                className={`w-[180px] flex-shrink-0 bg-slate-100 border rounded-md flex flex-col transition-all ${
                  isDraggedOver ? "border-blue-400 bg-blue-50" : "border-slate-200"
                }`}
              >
                {/* Column Header */}
                <div className={`p-2 border-b ${stage.border} ${stage.bg} rounded-t-md h-12 flex flex-col justify-center`}>
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className={`text-[10px] font-bold ${stage.text} leading-tight pr-1`}>{stage.name}</h3>
                    <span className="text-[9px] font-medium px-1.5 py-0.5 bg-white rounded-md border border-slate-200 text-slate-600 flex-shrink-0">
                      {stageLeads.length}
                    </span>
                  </div>
                  <p className="text-[9px] font-semibold text-slate-500">
                    ${(colValue / 1000000).toFixed(1)}M
                  </p>
                </div>

                {/* Cards Container */}
                <div className="p-1.5 flex-1 overflow-y-auto space-y-1.5 max-h-[calc(100vh-280px)]">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      className="bg-white border border-slate-200 p-2 rounded-sm shadow-sm hover:shadow hover:border-slate-300 cursor-grab active:cursor-grabbing transition-all group flex flex-col gap-1.5"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-bold text-slate-800 uppercase tracking-wide leading-tight line-clamp-2 pr-1" title={lead.companyName}>
                          {lead.companyName}
                        </span>
                        
                        <span className={`text-[7px] px-1 py-0.5 rounded-sm font-bold tracking-tight whitespace-nowrap ${
                          lead.riskLevel === "HOT" ? "bg-red-100 text-red-700" :
                          lead.riskLevel === "WARM" ? "bg-amber-100 text-amber-700" :
                          lead.riskLevel === "SPAM" ? "bg-slate-200 text-slate-500" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {lead.riskLevel === "HOT" ? "ALTO INTERÉS" :
                           lead.riskLevel === "WARM" ? "INTERÉS MEDIO" :
                           lead.riskLevel === "SPAM" ? "DESCARTADO" : 
                           "BAJA PRIORIDAD"}
                        </span>
                      </div>

                      <div className="space-y-0.5 border-l-2 border-slate-100 pl-1.5">
                        <p className="text-[9px] text-slate-600 font-medium truncate" title={lead.fullName}>
                          {lead.fullName}
                        </p>
                        <p className="text-[8px] text-slate-500 truncate" title={lead.city}>
                          {lead.city}
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded px-1.5 py-1 space-y-0.5">
                        <p className="text-[8px] text-slate-600 flex justify-between">
                          <span className="text-slate-400">Servicio:</span>
                          <span className="capitalize font-medium truncate max-w-[70px]">{lead.serviceType}</span>
                        </p>
                        <p className="text-[8px] text-slate-600 flex justify-between">
                          <span className="text-slate-400">Valor:</span>
                          <span className="font-bold text-slate-800">${((lead.estimatedBudgetMax || 0) / 1000000).toFixed(1)}M</span>
                        </p>
                        <p className="text-[8px] text-slate-600 flex justify-between">
                          <span className="text-slate-400">Asesor:</span>
                          <span className={`truncate max-w-[70px] ${!lead.assignedTo ? "text-slate-400 italic" : "font-medium text-slate-700"}`}>
                            {lead.assignedTo || "Sin asignar"}
                          </span>
                        </p>
                      </div>

                      <div className="flex justify-between items-center pt-1 mt-0.5 border-t border-slate-100">
                        <span className="text-[7px] text-slate-400 font-medium">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </span>
                        <Link 
                          href={`/crm/${lead.id}`}
                          className="text-[8px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ABRIR
                        </Link>
                      </div>
                    </div>
                  ))}

                  {stageLeads.length === 0 && (
                    <div className="h-10 border-2 border-dashed border-slate-200 rounded-sm flex items-center justify-center text-[8px] text-slate-400">
                      Arrastrar aquí
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
