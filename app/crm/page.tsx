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
  FileText,
  BriefcaseBusiness
} from "lucide-react";
import Link from "next/link";

const STAGES = [
  { id: "nuevo", name: "Nuevo Lead", bg: "bg-bg-secondary", border: "border-border-subtle", text: "text-text-secondary", prob: 10 },
  { id: "contacto", name: "Contacto Inicial", bg: "bg-bg-secondary", border: "border-border-subtle", text: "text-text-secondary", prob: 20 },
  { id: "reunion", name: "Reunión Agendada", bg: "bg-bg-secondary", border: "border-border-subtle", text: "text-text-secondary", prob: 30 },
  { id: "diagnostico", name: "Diagnóstico", bg: "bg-bg-secondary", border: "border-border-subtle", text: "text-text-secondary", prob: 40 },
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
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4 font-sans text-sm text-text-muted">
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
    <div className="w-full px-4 md:px-6 py-6 flex flex-col space-y-6 bg-bg-secondary font-sans text-text-primary h-full">
      
      {/* HEADER & FILTROS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Pipeline Comercial
          </h1>
          <p className="text-text-muted text-xs mt-1">Gestión B2B Enterprise de CYH Ingeniería.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Barra de Búsqueda */}
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-text-muted" />
            </div>
            <input
              type="text"
              placeholder="Buscar empresa o contacto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 w-full border border-border-medium rounded-md text-xs text-text-primary focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Filtro Asesor */}
          <div className="relative w-full sm:w-40">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-text-muted" />
            </div>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="pl-9 pr-3 py-1.5 w-full border border-border-medium rounded-md text-xs text-text-primary bg-bg-primary focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none"
            >
              <option value="all">Todos los Asesores</option>
              <option value="me">Asignados a Mí</option>
              <option value="unassigned">Sin Asignar</option>
            </select>
          </div>

          <button 
            onClick={fetchData}
            className="px-4 py-1.5 border border-border-subtle bg-bg-primary hover:border-border-medium hover:bg-bg-secondary text-text-secondary text-xs font-semibold rounded-md transition-colors shadow-sm whitespace-nowrap"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* 4 ADVANCED KPIs Requeridos */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-bg-primary border border-border-subtle p-5 rounded-md shadow-sm">
          <div className="flex items-center gap-2 text-text-muted mb-3">
            <div className="p-2 bg-amber-500/10 rounded-md">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider">Leads sin contacto</h3>
          </div>
          <p className="text-3xl font-display tracking-wide text-text-primary">{leads.filter(l => l.status === "nuevo").length}</p>
        </div>

        <div className="bg-bg-primary border border-border-subtle p-5 rounded-md shadow-sm">
          <div className="flex items-center gap-2 text-text-muted mb-3">
            <div className="p-2 bg-red-500/10 rounded-md">
              <Target className="w-4 h-4 text-red-500" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider">Tareas Vencidas</h3>
          </div>
          <p className="text-3xl font-display tracking-wide text-text-primary">{leads.filter(l => l.status !== "ganado" && l.status !== "perdido" && new Date(l.updatedAt).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000).length}</p>
        </div>

        <div className="bg-bg-primary border border-border-subtle p-5 rounded-md shadow-sm">
          <div className="flex items-center gap-2 text-text-muted mb-3">
            <div className="p-2 bg-accent-cyan/10 rounded-md">
              <FolderKanban className="w-4 h-4 text-accent-cyan" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider">Reuniones Próximas</h3>
          </div>
          <p className="text-3xl font-display tracking-wide text-text-primary">{leads.filter(l => l.status === "reunion").length}</p>
        </div>

        <div className="bg-bg-primary border border-border-subtle p-5 rounded-md shadow-sm">
          <div className="flex items-center gap-2 text-text-muted mb-3">
            <div className="p-2 bg-emerald-500/10 rounded-md">
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider">Forecast Comercial</h3>
          </div>
          <p className="text-3xl font-display tracking-wide text-text-primary">${(weightedPipelineValue / 1000000).toFixed(1)}M</p>
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
                className={`w-[260px] 2xl:w-[280px] flex-shrink-0 bg-bg-tertiary border rounded-md flex flex-col transition-all ${
                  isDraggedOver ? "border-accent-cyan/50 bg-accent-cyan/5" : "border-border-subtle"
                }`}
              >
                {/* Column Header */}
                <div className={`p-3 border-b ${stage.border} ${stage.bg} rounded-t-md flex flex-col gap-0.5`}>
                  <div className="flex justify-between items-center">
                    <h3 className={`text-xs font-bold ${stage.text} tracking-wide uppercase truncate pr-2`}>{stage.name}</h3>
                    <span className="text-xs font-semibold px-2 py-1 bg-bg-primary rounded-md border border-border-subtle text-text-secondary flex-shrink-0 shadow-sm">
                      {stageLeads.length}
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-text-muted">
                    ${(colValue / 1000000).toFixed(1)}M USD
                  </p>
                </div>

                {/* Cards Container */}
                <div className="p-2 flex-1 overflow-y-auto space-y-2 max-h-[calc(100vh-280px)] scrollbar-thin scrollbar-thumb-border-subtle">
                  {stageLeads.map((lead) => {
                    const daysInactive = Math.floor((Date.now() - new Date(lead.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
                    const isAlert = stage.id !== 'ganado' && stage.id !== 'perdido';
                    let alertClass = "border-border-subtle";
                    if (isAlert) {
                      if (daysInactive >= 14) alertClass = "border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]";
                      else if (daysInactive >= 7) alertClass = "border-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.3)]";
                      else if (daysInactive >= 3) alertClass = "border-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.3)]";
                    }

                    return (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      className={`bg-bg-primary border ${alertClass} p-3 rounded-md shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:border-border-medium cursor-grab active:cursor-grabbing transition-all group flex flex-col gap-2 relative`}
                    >
                      {/* Inactivity Badge */}
                      {isAlert && daysInactive >= 3 && (
                        <div className={`absolute -top-2 -right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white ${
                          daysInactive >= 14 ? "bg-red-500" : daysInactive >= 7 ? "bg-orange-500" : "bg-amber-500"
                        }`}>
                          {daysInactive}d sin cont.
                        </div>
                      )}
                      <div className="flex justify-between items-start gap-1">
                        <div className="flex items-start gap-1.5 overflow-hidden">
                          <div className="mt-0.5 p-1 bg-bg-secondary border border-border-subtle rounded-md flex-shrink-0">
                            <BriefcaseBusiness className="w-3.5 h-3.5 text-text-muted" />
                          </div>
                          <span className="text-xs font-bold text-text-primary tracking-wide leading-tight line-clamp-2" title={lead.companyName}>
                            {lead.companyName}
                          </span>
                        </div>
                        
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-sm font-bold tracking-wider uppercase whitespace-nowrap border ${
                          lead.riskLevel === "HOT" ? "bg-red-50 text-red-700 border-red-200" :
                          lead.riskLevel === "WARM" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          lead.riskLevel === "SPAM" ? "bg-bg-tertiary text-text-muted border-border-subtle" :
                          "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                          {lead.riskLevel === "HOT" ? "HOT" :
                           lead.riskLevel === "WARM" ? "WARM" :
                           lead.riskLevel === "SPAM" ? "SPAM" : 
                           "COLD"}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-text-secondary font-medium truncate" title={lead.fullName}>
                          {lead.fullName}
                        </p>
                        <p className="text-xs text-text-muted truncate flex items-center gap-1" title={lead.city}>
                           {lead.city}
                        </p>
                      </div>

                      <div className="bg-bg-secondary rounded-md px-2 py-1.5 space-y-0.5 border border-border-subtle/50">
                        <p className="text-[10px] text-text-secondary flex justify-between">
                          <span className="text-text-muted">Servicio:</span>
                          <span className="capitalize font-medium truncate max-w-[100px]">{lead.serviceType}</span>
                        </p>
                        <p className="text-[10px] text-text-secondary flex justify-between">
                          <span className="text-text-muted">Valor:</span>
                          <span className="font-bold text-text-primary">${((lead.estimatedBudgetMax || 0) / 1000000).toFixed(1)}M</span>
                        </p>
                        <p className="text-[10px] text-text-secondary flex justify-between">
                          <span className="text-text-muted">Asesor:</span>
                          <span className={`truncate max-w-[100px] ${!lead.assignedTo ? "text-text-muted italic" : "font-medium text-text-secondary"}`}>
                            {lead.assignedTo || "Sin asignar"}
                          </span>
                        </p>
                      </div>

                      <div className="flex justify-between items-center pt-1.5 border-t border-border-subtle">
                        <span className="text-[9px] text-text-muted font-mono">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </span>
                        <Link 
                          href={`/crm/${lead.id}`}
                          className="text-[10px] font-bold text-accent-cyan hover:text-accent-cyan/80 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ABRIR <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                    );
                  })}

                  {stageLeads.length === 0 && (
                    <div className="h-20 border-2 border-dashed border-border-subtle rounded-md flex items-center justify-center text-xs font-medium text-text-muted bg-bg-primary/50">
                      Soltar Lead Aquí
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
