"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  DollarSign, 
  TrendingUp, 
  Percent, 
  Filter, 
  Plus, 
  Search, 
  Download, 
  Printer, 
  Share2, 
  X, 
  Loader2, 
  AlertTriangle,
  Eye,
  ShieldAlert,
  LayoutGrid,
  List
} from "lucide-react";
import { createOpportunityAction } from "@/lib/server-actions/crm";

const formatCOP = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

interface OportunidadesClientProps {
  initialOpps: any[];
  activeLeads: any[];
  userRole: string;
  isAdmin: boolean;
  isTecnico: boolean;
  initialQuery: string;
  initialProb: string;
  initialSolucion: string;
}

export default function OportunidadesClient({ 
  initialOpps, 
  activeLeads,
  userRole,
  isAdmin,
  isTecnico,
  initialQuery,
  initialProb,
  initialSolucion
}: OportunidadesClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const currentView = searchParams.get("view") || "list";

  const [search, setSearch] = useState(initialQuery);
  const [filterProb, setFilterProb] = useState(initialProb);
  const [filterSolucion, setFilterSolucion] = useState(initialSolucion);
  
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

  // Sync state with url when search params change
  useEffect(() => {
    setSearch(searchParams.get("q") || "");
    setFilterProb(searchParams.get("probabilidad") || "all");
    setFilterSolucion(searchParams.get("solucion") || "all");
  }, [searchParams]);

  // Update URL parameters
  const updateURL = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    const params = new URLSearchParams(searchParams.toString());
    if (val) {
      params.set("q", val);
    } else {
      params.delete("q");
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Filter opportunities in memory (secondary filtering on top of server data)
  const filteredOpps = initialOpps.filter(o => {
    const matchesSearch = 
      (o.companyName || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.opportunity.title || "").toLowerCase().includes(search.toLowerCase());
    
    let matchesProb = true;
    if (filterProb === "alta") {
      matchesProb = o.opportunity.probability >= 70;
    } else if (filterProb === "media") {
      matchesProb = o.opportunity.probability >= 30 && o.opportunity.probability < 70;
    } else if (filterProb === "baja") {
      matchesProb = o.opportunity.probability < 30;
    }

    const matchesSolucion = filterSolucion === "all" || o.opportunity.serviceType === filterSolucion;
    
    return matchesSearch && matchesProb && matchesSolucion;
  });

  // Calculations
  const totalEstimated = filteredOpps.reduce((acc, curr) => acc + curr.opportunity.estimatedValue, 0);
  const totalWeighted = filteredOpps.reduce((acc, curr) => acc + curr.opportunity.weightedValue, 0);
  
  // Margen Técnico Estimado: standard 40% margin of the estimated value
  // Let's compute average margin percentage
  const avgMarginPercent = filteredOpps.length > 0 ? 40 : 0;

  const handleExportCSV = () => {
    if (isTecnico) {
      alert("Acceso denegado: Los técnicos no pueden exportar datos financieros.");
      return;
    }
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
    link.setAttribute("download", `forecast_oportunidades_${new Date().toISOString().slice(0,10)}.csv`);
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
      alert("Enlace copiado al portapapeles:\n" + url);
    }
  };

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isTecnico) return;
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
        router.refresh();
      } else {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err.message || "Error al crear la oportunidad");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to check if a date is within 48 hours or expired
  const isLicitacionCritica = (dateStr: any) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffHours = diffTime / (1000 * 60 * 60);
    return diffHours <= 48;
  };

  return (
    <div className="flex flex-col h-auto min-h-screen md:h-[calc(100vh-4rem)] bg-[#F8FAFC] p-4 md:p-8 font-sans overflow-visible md:overflow-hidden">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-slate-700" /> 
            Mesa de Oportunidades Comerciales
          </h1>
          <p className="text-xs text-slate-500 mt-1">Preingeniería, finanzas y forecast de licitaciones industriales B2B.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handlePrint}
            title="Imprimir"
            className="p-2 border border-slate-200 bg-white text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-50 transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button 
            onClick={handleShare}
            title="Compartir"
            className="p-2 border border-slate-200 bg-white text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-50 transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
          {!isTecnico && (
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-700 hover:text-slate-950 hover:border-slate-400 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Exportar CSV
            </button>
          )}
          {!isTecnico && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-md text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Nueva Oportunidad
            </button>
          )}
        </div>
      </div>

      {/* PANEL SUPERIOR DE METRICAS (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 shrink-0">
        {/* KPI 1: Valor Total */}
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor Total Pipeline</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-bold text-slate-900 truncate">
              {isTecnico ? "$0" : formatCOP(totalEstimated)}
            </div>
            {isTecnico && (
              <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1 mt-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Financiero Restringido
              </span>
            )}
          </div>
        </div>
        
        {/* KPI 2: Forecast Ponderado */}
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm flex flex-col justify-between border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Forecast Ponderado Real</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-bold text-slate-900 truncate">
              {isTecnico ? "$0" : formatCOP(totalWeighted)}
            </div>
            {isTecnico ? (
              <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1 mt-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Financiero Restringido
              </span>
            ) : (
              <span className="text-[10px] text-emerald-600 font-bold block mt-1">Calculado por probabilidad</span>
            )}
          </div>
        </div>

        {/* KPI 3: Margen Técnico Estimado */}
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm flex flex-col justify-between border-l-4 border-l-slate-700">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Margen Técnico Promedio</span>
            <Percent className="w-4 h-4 text-slate-700" />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-bold text-slate-900 truncate">
              {isTecnico ? "0%" : `${avgMarginPercent}%`}
            </div>
            {isTecnico ? (
              <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1 mt-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Financiero Restringido
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 font-medium block mt-1">Margen comercial proyectado</span>
            )}
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white border border-slate-200 rounded-t-lg p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-800">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="font-bold uppercase tracking-wider">Filtros:</span>
          </div>

          {/* Probabilidad */}
          <select 
            value={filterProb} 
            onChange={e => {
              setFilterProb(e.target.value);
              updateURL("probabilidad", e.target.value);
            }}
            className="px-2.5 py-1.5 bg-slate-55 border border-slate-200 rounded text-slate-800 focus:outline-none focus:border-slate-400 font-semibold text-xs"
          >
            <option value="all">Probabilidad (Cualquiera)</option>
            <option value="alta">Alta (≥ 70%)</option>
            <option value="media">Media (30% - 69%)</option>
            <option value="baja">Baja (&lt; 30%)</option>
          </select>

          {/* Solución */}
          <select 
            value={filterSolucion} 
            onChange={e => {
              setFilterSolucion(e.target.value);
              updateURL("solucion", e.target.value);
            }}
            className="px-2.5 py-1.5 bg-slate-55 border border-slate-200 rounded text-slate-800 focus:outline-none focus:border-slate-400 font-semibold text-xs text-capitalize"
          >
            <option value="all">Solución (Cualquiera)</option>
            <option value="venta">Venta / Suministro</option>
            <option value="fabricacion">Fabricación Especial</option>
            <option value="mantenimiento">Mantenimiento</option>
            <option value="reparacion">Reparación</option>
          </select>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por cliente o proyecto..." 
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:border-slate-400" 
            />
          </div>

          {/* View Switcher */}
          <div className="flex items-center gap-1.5 border border-slate-200 rounded p-1 bg-slate-50 shrink-0 select-none">
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("view", "list");
                router.replace(`${pathname}?${params.toString()}`);
              }}
              title="Vista de Tabla"
              className={`p-1 rounded transition-colors ${
                currentView === "list"
                  ? "bg-slate-900 text-white"
                  : "text-slate-400 hover:text-slate-900"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("view", "grid");
                router.replace(`${pathname}?${params.toString()}`);
              }}
              title="Vista de Tarjetas"
              className={`p-1 rounded transition-colors ${
                currentView === "grid"
                  ? "bg-slate-900 text-white"
                  : "text-slate-400 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CUERPO DE DATOS (Móvil vs Escritorio) */}
      <div className="flex-1 bg-white border border-slate-200 rounded-b-md shadow-sm overflow-visible md:overflow-hidden flex flex-col">
        {filteredOpps.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
            <AlertTriangle className="w-10 h-10 text-slate-400 mb-2" />
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Sin Oportunidades</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              No hay registros que coincidan con la búsqueda. Modifique los filtros o añada una nueva.
            </p>
            {!isTecnico && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="mt-4 px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Añadir Oportunidad
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 md:overflow-y-auto overflow-visible">
            {currentView === "list" ? (
              <>
                {/* DESKTOP VIEW: high density table */}
                <table className="hidden md:table w-full text-left border-collapse table-fixed">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-15">
                    <tr className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                      <th className="p-3 w-1/4">Código OP | Cliente / Proyecto</th>
                      <th className="p-3 w-[15%]">Tipo Solución</th>
                      <th className="p-3 w-[15%]">Probabilidad</th>
                      <th className="p-3 w-[15%] text-right">Monto Estimado</th>
                      <th className="p-3 w-[15%] text-right">Ponderado</th>
                      <th className="p-3 w-[12%]">Límite Licitación</th>
                      <th className="p-3 w-[8%] text-center">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredOpps.map(({ opportunity, lead, companyName, diagnosticReport }) => {
                      const critical = isLicitacionCritica(opportunity.expectedCloseDate);
                      return (
                        <tr key={opportunity.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="p-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-850 text-sm uppercase truncate">
                                {companyName || lead.companyName || "Desconocido"} | <span className="text-slate-500 font-medium normal-case">{lead.environmentType || "Planta General"}</span>
                              </span>
                              <span className="bg-slate-100 text-slate-600 font-mono text-[10px] font-bold px-2 py-0.5 rounded select-none shrink-0">
                                OP-{opportunity.id.slice(0, 4).toUpperCase()}
                              </span>
                              {critical && (
                                <span className="bg-red-100 text-red-700 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight shrink-0 border border-red-200">
                                  Licitación Crítica
                                </span>
                              )}
                              {(!diagnosticReport || !diagnosticReport.id) && (
                                <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight shrink-0">
                                  Telemetría Pendiente
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 block truncate mt-1">{opportunity.title}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-semibold uppercase text-slate-600 block w-max">
                              {opportunity.serviceType}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                                <div 
                                  className={`h-full ${
                                    opportunity.probability >= 70 
                                      ? "bg-emerald-500" 
                                      : opportunity.probability >= 30 
                                      ? "bg-blue-500" 
                                      : "bg-rose-500"
                                  }`} 
                                  style={{ width: `${opportunity.probability}%` }}
                                ></div>
                              </div>
                              <span className={`text-[11px] font-bold ${
                                opportunity.probability >= 70 
                                  ? "text-emerald-600" 
                                  : opportunity.probability >= 30 
                                  ? "text-blue-600" 
                                  : "text-rose-600"
                              }`}>{opportunity.probability}%</span>
                            </div>
                          </td>
                          <td className="p-3 text-right font-bold text-slate-800">
                            {isTecnico ? "$0" : formatCOP(opportunity.estimatedValue)}
                          </td>
                          <td className="p-3 text-right font-bold text-slate-800">
                            {isTecnico ? "$0" : formatCOP(opportunity.weightedValue)}
                          </td>
                          <td className="p-3 font-medium text-slate-500">
                            {opportunity.expectedCloseDate 
                              ? new Date(opportunity.expectedCloseDate).toLocaleDateString("es-CO", { day: '2-digit', month: 'short', year: '2-digit' })
                              : "Por definir"}
                          </td>
                          <td className="p-3 text-center">
                            <Link 
                              href={`/crm/oportunidades/${opportunity.id}`}
                              className="inline-flex items-center justify-center p-1.5 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* MOBILE VIEW: Stacked Cards with LED Glow borders */}
                <div className="md:hidden p-4 space-y-4">
                  {filteredOpps.map(({ opportunity, lead, companyName, diagnosticReport }) => {
                    const critical = isLicitacionCritica(opportunity.expectedCloseDate);
                    
                    // Color configuration for LED borders based on probability
                    let ledClass = "";
                    let indicatorColor = "";
                    if (opportunity.probability >= 70) {
                      ledClass = "border-l-4 border-l-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.15)]";
                      indicatorColor = "bg-emerald-500";
                    } else if (opportunity.probability >= 30) {
                      ledClass = "border-l-4 border-l-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.15)]";
                      indicatorColor = "bg-blue-500";
                    } else {
                      ledClass = "border-l-4 border-l-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.15)]";
                      indicatorColor = "bg-rose-500";
                    }

                    return (
                      <div 
                        key={opportunity.id} 
                        className={`bg-white rounded-lg border border-slate-200 p-4 flex flex-col justify-between ${ledClass} relative`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                              <h4 className="font-bold text-slate-850 text-sm uppercase truncate">
                                {companyName || lead.companyName || "Desconocido"} | <span className="text-slate-500 font-medium normal-case">{lead.environmentType || "Planta General"}</span>
                              </h4>
                              <span className="bg-slate-105 text-slate-600 font-mono text-[10px] font-bold px-2 py-0.5 rounded select-none shrink-0">
                                OP-{opportunity.id.slice(0, 4).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                              {critical && (
                                <span className="bg-red-50 text-red-700 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight border border-red-100">
                                  Licitación Crítica
                                </span>
                              )}
                              {(!diagnosticReport || !diagnosticReport.id) && (
                                <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">
                                  Telemetría Pendiente
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 truncate mt-0.5">{opportunity.title}</p>
                          </div>
                          <Link 
                            href={`/crm/oportunidades/${opportunity.id}`}
                            className="p-2 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-700 shrink-0 self-center"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] py-2 border-t border-b border-slate-50 my-2">
                          <div>
                            <span className="text-slate-400 block">Tipo:</span>
                            <span className="font-semibold text-slate-700 uppercase">{opportunity.serviceType}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-right">Cierre:</span>
                            <span className="font-semibold text-slate-700 block text-right">
                              {opportunity.expectedCloseDate 
                                ? new Date(opportunity.expectedCloseDate).toLocaleDateString() 
                                : "Definir"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${indicatorColor}`}></span>
                            <span className="text-xs font-bold text-slate-700">{opportunity.probability}% Éxito</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">Monto Ponderado:</span>
                            <span className="text-xs font-bold text-slate-900">
                              {isTecnico ? "$0" : formatCOP(opportunity.weightedValue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              /* Grid View: Cards Grid for all devices */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 overflow-y-auto max-h-full">
                {filteredOpps.map(({ opportunity, lead, companyName, diagnosticReport }) => {
                  const critical = isLicitacionCritica(opportunity.expectedCloseDate);
                  
                  // Color configuration for LED borders based on probability
                  let ledClass = "";
                  let indicatorColor = "";
                  if (opportunity.probability >= 70) {
                    ledClass = "border-l-4 border-l-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.15)]";
                    indicatorColor = "bg-emerald-500";
                  } else if (opportunity.probability >= 30) {
                    ledClass = "border-l-4 border-l-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.15)]";
                    indicatorColor = "bg-blue-500";
                  } else {
                    ledClass = "border-l-4 border-l-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.15)]";
                    indicatorColor = "bg-rose-500";
                  }

                  return (
                    <div 
                      key={opportunity.id} 
                      className={`bg-white rounded-lg border border-slate-200 p-4 flex flex-col justify-between ${ledClass} relative`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <h4 className="font-bold text-slate-855 text-sm uppercase truncate">
                              {companyName || lead.companyName || "Desconocido"} | <span className="text-slate-500 font-medium normal-case">{lead.environmentType || "Planta General"}</span>
                            </h4>
                            <span className="bg-slate-100 text-slate-600 font-mono text-[10px] font-bold px-2 py-0.5 rounded select-none shrink-0">
                              OP-{opportunity.id.slice(0, 4).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                            {critical && (
                              <span className="bg-red-50 text-red-700 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight border border-red-100">
                                Licitación Crítica
                              </span>
                            )}
                            {(!diagnosticReport || !diagnosticReport.id) && (
                              <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">
                                Telemetría Pendiente
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{opportunity.title}</p>
                        </div>
                        <Link 
                          href={`/crm/oportunidades/${opportunity.id}`}
                          className="p-2 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-700 shrink-0 self-center"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] py-2 border-t border-b border-slate-50 my-2">
                        <div>
                          <span className="text-slate-400 block">Tipo:</span>
                          <span className="font-semibold text-slate-700 uppercase">{opportunity.serviceType}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-right">Cierre:</span>
                          <span className="font-semibold text-slate-700 block text-right">
                            {opportunity.expectedCloseDate 
                              ? new Date(opportunity.expectedCloseDate).toLocaleDateString() 
                              : "Definir"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${indicatorColor}`}></span>
                          <span className="text-xs font-bold text-slate-700">{opportunity.probability}% Éxito</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Monto Ponderado:</span>
                          <span className="text-xs font-bold text-slate-900">
                            {isTecnico ? "$0" : formatCOP(opportunity.weightedValue)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* NEW OPPORTUNITY MODAL (ONLY ADMIN/VENDEDOR) */}
      {isModalOpen && !isTecnico && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-md p-6 shadow-xl relative max-h-[95vh] overflow-y-auto">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide mb-4">Añadir Nueva Oportunidad</h3>
            
            {error && (
              <div className="bg-red-50 text-red-700 text-xs p-2.5 rounded border border-red-200 mb-4 font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </div>
            )}
            
            <form onSubmit={handleCreateOpportunity} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Lead Relacionado *</label>
                <select 
                  required
                  value={form.leadId} 
                  onChange={e => setForm({...form, leadId: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-400 text-xs"
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
                <label className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Título del Proyecto / Oportunidad *</label>
                <input 
                  required 
                  type="text"
                  placeholder="Ej: Extractores Nave de Ácidos"
                  value={form.title} 
                  onChange={e => setForm({...form, title: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-850 focus:outline-none focus:border-slate-400 text-xs" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Tipo de Solución *</label>
                  <select 
                    value={form.serviceType} 
                    onChange={e => setForm({...form, serviceType: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-400 text-xs"
                  >
                    <option value="venta">Venta / Suministro</option>
                    <option value="fabricacion">Fabricación</option>
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="reparacion">Reparación</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Asesor Asignado</label>
                  <input 
                    type="text"
                    placeholder="Ej: John Doe"
                    value={form.assignedTo} 
                    onChange={e => setForm({...form, assignedTo: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-400 text-xs" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Monto Estimado (COP) *</label>
                  <input 
                    required 
                    type="number"
                    value={form.estimatedValue || ""} 
                    onChange={e => setForm({...form, estimatedValue: Number(e.target.value)})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-400 text-xs" 
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Probabilidad (0-100) *</label>
                  <input 
                    required 
                    type="number"
                    min="0"
                    max="100"
                    value={form.probability} 
                    onChange={e => setForm({...form, probability: Number(e.target.value)})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-850 focus:outline-none focus:border-slate-400 text-xs" 
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Etapa de la Negociación *</label>
                <select 
                  value={form.stage} 
                  onChange={e => setForm({...form, stage: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-400 text-xs text-capitalize"
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
                className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-md mt-4 hover:bg-slate-850 transition-colors flex items-center justify-center gap-2"
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
