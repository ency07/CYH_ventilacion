"use client";

import React, { useState } from "react";
import { DollarSign, TrendingUp, Filter, Plus, Search, Download, Printer, Share2, X, Loader2 } from "lucide-react";
import { createOpportunityAction } from "@/lib/server-actions/crm";

const formatCOP = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function OportunidadesClient({ 
  initialOpps, 
  activeLeads 
}: { 
  initialOpps: any[], 
  activeLeads: any[] 
}) {
  const [opps, setOpps] = useState(initialOpps);
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [filterAdvisor, setFilterAdvisor] = useState("all");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    leadId: activeLeads.length > 0 ? activeLeads[0].id : "",
    title: "",
    serviceType: "venta",
    estimatedValue: 0,
    probability: 50,
    stage: "analisis",
    assignedTo: ""
  });

  const uniqueAdvisors = Array.from(new Set(initialOpps.map(o => o.opportunity.assignedTo).filter(Boolean)));
  const uniqueStages = Array.from(new Set(initialOpps.map(o => o.opportunity.stage).filter(Boolean)));

  const filteredOpps = opps.filter(o => {
    const matchesSearch = 
      (o.companyName || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.opportunity.title || "").toLowerCase().includes(search.toLowerCase());
    const matchesStage = filterStage === "all" || o.opportunity.stage === filterStage;
    const matchesAdvisor = filterAdvisor === "all" || o.opportunity.assignedTo === filterAdvisor;
    return matchesSearch && matchesStage && matchesAdvisor;
  });

  const totalEstimated = filteredOpps.reduce((acc, curr) => acc + curr.opportunity.estimatedValue, 0);
  const totalWeighted = filteredOpps.reduce((acc, curr) => acc + curr.opportunity.weightedValue, 0);

  const handleExportCSV = () => {
    const headers = ["ID Oportunidad", "Cliente/Empresa", "Titulo de Proyecto", "Etapa", "Valor Estimado (COP)", "Probabilidad %", "Valor Ponderado (COP)", "Asesor Asignado", "Fecha Cierre"];
    const rows = filteredOpps.map(o => [
      o.opportunity.id,
      o.companyName || "Desconocido",
      o.opportunity.title,
      o.opportunity.stage,
      o.opportunity.estimatedValue,
      o.opportunity.probability,
      o.opportunity.weightedValue,
      o.opportunity.assignedTo,
      o.opportunity.expectedCloseDate ? new Date(o.opportunity.expectedCloseDate).toLocaleDateString() : "Por definir"
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `forecast_financiero_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      alert("Enlace del Forecast Financiero copiado al portapapeles:\n" + url);
    }
  };

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leadId) {
      setError("Debes seleccionar un Lead activo.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await createOpportunityAction({
        leadId: form.leadId,
        title: form.title,
        serviceType: form.serviceType,
        estimatedValue: Number(form.estimatedValue),
        probability: Number(form.probability),
        stage: form.stage,
        assignedTo: form.assignedTo || "Admin"
      });
      if (res.success) {
        setIsModalOpen(false);
        setForm({
          leadId: activeLeads.length > 0 ? activeLeads[0].id : "",
          title: "",
          serviceType: "venta",
          estimatedValue: 0,
          probability: 50,
          stage: "analisis",
          assignedTo: ""
        });
        window.location.reload();
      } else {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err.message || "Error al crear la oportunidad");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-bg-secondary p-8 font-sans overflow-hidden">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary uppercase tracking-wide flex items-center gap-3">
            <DollarSign className="w-7 h-7 text-emerald-500" /> 
            Forecast Financiero
          </h1>
          <p className="text-sm text-text-muted mt-1">Control de oportunidades avanzadas y proyecciones de cierre ponderadas.</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handlePrint}
            title="Imprimir Forecast"
            className="p-2 border border-border-subtle bg-bg-primary text-text-secondary hover:text-text-primary rounded hover:bg-bg-secondary transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button 
            onClick={handleShare}
            title="Compartir Forecast"
            className="p-2 border border-border-subtle bg-bg-primary text-text-secondary hover:text-text-primary rounded hover:bg-bg-secondary transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-bg-primary border border-border-subtle rounded-md text-sm font-bold text-text-secondary hover:text-text-primary hover:border-accent-cyan transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-text-primary text-bg-primary rounded-md text-sm font-bold hover:bg-text-secondary transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" /> Nueva Oportunidad
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-bg-primary border border-border-subtle rounded-t-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-sm z-10 relative">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2 text-text-primary">
            <Filter className="w-4 h-4" />
            <span className="font-bold uppercase tracking-wider">Filtros:</span>
          </div>

          <select 
            value={filterStage} 
            onChange={e => setFilterStage(e.target.value)}
            className="px-3 py-1.5 bg-bg-secondary border border-border-subtle rounded text-text-primary focus:outline-none focus:border-accent-cyan font-medium"
          >
            <option value="all">Todas las Etapas</option>
            {uniqueStages.map((stage: any) => (
              <option key={stage} value={stage}>{stage.replace(/_/g, ' ').toUpperCase()}</option>
            ))}
          </select>

          <select 
            value={filterAdvisor} 
            onChange={e => setFilterAdvisor(e.target.value)}
            className="px-3 py-1.5 bg-bg-secondary border border-border-subtle rounded text-text-primary focus:outline-none focus:border-accent-cyan font-medium"
          >
            <option value="all">Todos los Asesores</option>
            {uniqueAdvisors.map((adv: any) => (
              <option key={adv} value={adv}>{adv}</option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-72">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Buscar por cliente o proyecto..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-bg-secondary border border-border-subtle rounded-md text-text-primary focus:outline-none focus:border-accent-cyan" 
            />
          </div>
        </div>
      </div>

      {/* Resumen Financiero Dinámico */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 shrink-0">
        <div className="bg-bg-primary p-5 border border-border-subtle rounded shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Total Pipeline Abierto (Filtrado)</span>
            <DollarSign className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-display font-bold text-blue-500 truncate">{formatCOP(totalEstimated)}</div>
        </div>
        
        <div className="bg-bg-primary p-5 border border-border-subtle rounded shadow-sm flex flex-col justify-between border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Forecast Ponderado (Filtrado)</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-display font-bold text-text-primary truncate">{formatCOP(totalWeighted)}</div>
        </div>
      </div>

      {/* TABLA DE FORECAST */}
      <div className="flex-1 bg-bg-primary border border-border-subtle rounded-b-md shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-bg-secondary sticky top-0 z-10">
              <tr>
                <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle">Cliente / Título</th>
                <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle">Etapa</th>
                <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle text-right">Valor Estimado</th>
                <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle text-center">Probabilidad</th>
                <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle text-right">Valor Ponderado</th>
                <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle">Asesor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredOpps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-sm text-text-muted">No hay oportunidades financieras registradas que coincidan.</td>
                </tr>
              ) : (
                filteredOpps.map(({ opportunity, lead, companyName }) => (
                  <tr key={opportunity.id} className="hover:bg-bg-secondary/50 transition-colors group">
                    <td className="p-4">
                      <span className="font-bold text-text-primary text-sm uppercase block">
                        {companyName || 'Desconocido'}
                      </span>
                      <span className="text-[11px] text-text-secondary">{opportunity.title}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] px-2 py-1 bg-bg-secondary border border-border-subtle rounded-sm font-semibold uppercase text-text-secondary">
                        {opportunity.stage.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-text-primary">
                      {formatCOP(opportunity.estimatedValue)}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 bg-bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${opportunity.probability}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 w-8">{opportunity.probability}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-bold text-emerald-600 bg-emerald-50/30">
                      {formatCOP(opportunity.weightedValue)}
                    </td>
                    <td className="p-4 text-xs font-medium text-text-secondary capitalize">
                      {opportunity.assignedTo}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW OPPORTUNITY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-bg-primary border border-border-subtle rounded-md w-full max-w-md p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-text-muted hover:text-text-primary">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-text-primary uppercase tracking-wide mb-4">Nueva Oportunidad</h3>
            {error && <p className="text-red-500 text-xs mb-4">{error}</p>}
            
            <form onSubmit={handleCreateOpportunity} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-text-muted uppercase tracking-wider block mb-1">Lead / Cuenta Relacionada *</label>
                <select 
                  required
                  value={form.leadId} 
                  onChange={e => setForm({...form, leadId: e.target.value})}
                  className="w-full bg-bg-secondary border border-border-subtle rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-cyan bg-bg-primary"
                >
                  {activeLeads.length === 0 ? (
                    <option value="">No hay leads activos disponibles</option>
                  ) : (
                    activeLeads.map(l => (
                      <option key={l.id} value={l.id}>{l.companyName} - {l.fullName}</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="font-bold text-text-muted uppercase tracking-wider block mb-1">Título de la Oportunidad *</label>
                <input 
                  required 
                  type="text"
                  placeholder="Ej: Suministro de Extractores de Aire"
                  value={form.title} 
                  onChange={e => setForm({...form, title: e.target.value})} 
                  className="w-full bg-bg-secondary border border-border-subtle rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-cyan" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-text-muted uppercase tracking-wider block mb-1">Tipo de Servicio *</label>
                  <select 
                    value={form.serviceType} 
                    onChange={e => setForm({...form, serviceType: e.target.value})}
                    className="w-full bg-bg-secondary border border-border-subtle rounded px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-cyan bg-bg-primary"
                  >
                    <option value="venta">Venta</option>
                    <option value="fabricacion">Fabricación</option>
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="reparacion">Reparación</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-text-muted uppercase tracking-wider block mb-1">Asesor Responsable</label>
                  <input 
                    type="text"
                    placeholder="Ej: John Doe"
                    value={form.assignedTo} 
                    onChange={e => setForm({...form, assignedTo: e.target.value})} 
                    className="w-full bg-bg-secondary border border-border-subtle rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-cyan" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-text-muted uppercase tracking-wider block mb-1">Monto Estimado (COP) *</label>
                  <input 
                    required 
                    type="number"
                    value={form.estimatedValue} 
                    onChange={e => setForm({...form, estimatedValue: Number(e.target.value)})} 
                    className="w-full bg-bg-secondary border border-border-subtle rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-cyan" 
                  />
                </div>
                <div>
                  <label className="font-bold text-text-muted uppercase tracking-wider block mb-1">Probabilidad % (0-100) *</label>
                  <input 
                    required 
                    type="number"
                    min="0"
                    max="100"
                    value={form.probability} 
                    onChange={e => setForm({...form, probability: Number(e.target.value)})} 
                    className="w-full bg-bg-secondary border border-border-subtle rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-cyan" 
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-text-muted uppercase tracking-wider block mb-1">Etapa Comercial *</label>
                <select 
                  value={form.stage} 
                  onChange={e => setForm({...form, stage: e.target.value})}
                  className="w-full bg-bg-secondary border border-border-subtle rounded px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-cyan bg-bg-primary animate-none"
                >
                  <option value="analisis">Análisis</option>
                  <option value="propuesta">Propuesta</option>
                  <option value="negociacion">Negociación</option>
                  <option value="cerrado_ganado">Cerrado Ganado</option>
                  <option value="cerrado_perdido">Cerrado Perdido</option>
                </select>
              </div>

              <button 
                disabled={submitting} 
                type="submit" 
                className="w-full py-2.5 bg-text-primary text-bg-primary text-xs font-bold uppercase tracking-wider rounded mt-4 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...
                  </>
                ) : "Crear Oportunidad"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
