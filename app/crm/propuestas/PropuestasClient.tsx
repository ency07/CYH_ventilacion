"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  TrendingUp, 
  Percent, 
  Clock, 
  ChevronRight, 
  X, 
  Loader2, 
  AlertTriangle,
  FileSignature
} from "lucide-react";
import { createProposalAction } from "@/lib/server-actions/crm";

const formatCOP = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

interface PropuestasClientProps {
  initialProposals: any[];
  activeLeads: any[];
  kpis: {
    totalPresented: number;
    winRate: number;
    avgAcceptDays: number;
  };
  userRole: string;
  isAdmin: boolean;
  initialQuery: string;
  initialEstado: string;
}

export default function PropuestasClient({
  initialProposals,
  activeLeads,
  kpis,
  userRole,
  isAdmin,
  initialQuery,
  initialEstado
}: PropuestasClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState(initialQuery);
  const [filterEstado, setFilterEstado] = useState(initialEstado);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    leadId: activeLeads.length > 0 ? activeLeads[0].id : "",
    title: "",
    totalValue: 0
  });

  // Sync state with url search params
  useEffect(() => {
    setSearch(searchParams.get("q") || "");
    setFilterEstado(searchParams.get("estado") || "all");
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

  // Filter proposals in memory
  const filteredProps = initialProposals.filter(p => {
    const matchesSearch = 
      (p.companyName || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.proposal.title || "").toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = filterEstado === "all" || p.proposal.status === filterEstado;
    return matchesSearch && matchesStatus;
  });

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leadId) {
      setError("Debes seleccionar un Lead activo.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await createProposalAction({
        leadId: form.leadId,
        title: form.title,
        totalValue: Number(form.totalValue),
        status: "borrador"
      });
      if (res.success) {
        setIsModalOpen(false);
        setForm({
          leadId: activeLeads.length > 0 ? activeLeads[0].id : "",
          title: "",
          totalValue: 0
        });
        router.refresh();
      } else {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err.message || "Error al crear la propuesta");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to check if a proposal is expired
  const isProposalExpired = (proposal: any) => {
    return (
      proposal.status === "enviada" &&
      proposal.validUntil &&
      new Date(proposal.validUntil) < new Date()
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aceptada':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Aprobada</span>;
      case 'rechazada':
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Rechazada</span>;
      case 'enviada':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Enviada</span>;
      default:
        return <span className="bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Borrador</span>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] p-4 md:p-8 font-sans overflow-hidden">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <FileSignature className="w-6 h-6 text-slate-700" /> 
            Repositorio de Propuestas y Ofertas
          </h1>
          <p className="text-xs text-slate-500 mt-1">Cierre de contratos, términos comerciales y cotizaciones ejecutivas.</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-md text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Nueva Propuesta
          </button>
        </div>
      </div>

      {/* PANEL SUPERIOR DE KPI'S (CONVERSIÓN) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 shrink-0">
        
        {/* KPI 1: Ofertas Presentadas */}
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ofertas Presentadas</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-bold text-slate-900 truncate">
              {kpis.totalPresented}
            </div>
            <span className="text-[10px] text-slate-500 font-medium block mt-1">Excluye borradores locales</span>
          </div>
        </div>

        {/* KPI 2: Win Rate */}
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm flex flex-col justify-between border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tasa de Aceptación (Win Rate)</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-bold text-slate-900 truncate">
              {kpis.winRate}%
            </div>
            <span className="text-[10px] text-emerald-600 font-bold block mt-1">Aprobadas / Emitidas</span>
          </div>
        </div>

        {/* KPI 3: Días de Aceptación */}
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm flex flex-col justify-between border-l-4 border-l-slate-700">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Promedio de Cierre</span>
            <Clock className="w-4 h-4 text-slate-700" />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-bold text-slate-900 truncate">
              {kpis.avgAcceptDays} <span className="text-sm font-semibold text-slate-500">días</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium block mt-1">Desde emisión hasta firma</span>
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

          {/* Estado dropdown */}
          <select 
            value={filterEstado} 
            onChange={e => {
              setFilterEstado(e.target.value);
              updateURL("estado", e.target.value);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800 focus:outline-none focus:border-slate-400 font-semibold text-xs text-capitalize"
          >
            <option value="all">Estado (Todos)</option>
            <option value="borrador">Borrador</option>
            <option value="enviada">Enviada</option>
            <option value="aceptada">Aprobada</option>
            <option value="rechazada">Rechazada</option>
          </select>
        </div>

        <div className="w-full md:w-72">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar propuesta..." 
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-55 border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:border-slate-400" 
            />
          </div>
        </div>
      </div>

      {/* COTIZACIONES GRID / TABLE */}
      <div className="flex-1 bg-white border border-slate-200 rounded-b-md shadow-sm overflow-hidden flex flex-col">
        {filteredProps.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
            <AlertTriangle className="w-10 h-10 text-slate-400 mb-2" />
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Sin Propuestas</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              No hay propuestas comerciales cargadas bajo esta clasificación.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            
            {/* DESKTOP TABLE: Thin Row Executive Grid */}
            <table className="hidden md:table w-full text-left border-collapse table-fixed">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                <tr className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="p-3 w-[15%]">Código Oferta</th>
                  <th className="p-3 w-1/4">Cliente / Empresa</th>
                  <th className="p-3 w-1/4">Oportunidad Origen</th>
                  <th className="p-3 w-[10%] text-center">Versión</th>
                  <th className="p-3 w-[15%] text-right">Monto Bruto (COP)</th>
                  <th className="p-3 w-[10%] text-center">Estado</th>
                  <th className="p-3 w-[8%] text-center">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProps.map(({ proposal, lead, companyName, opportunity }) => {
                  const expired = isProposalExpired(proposal);
                  return (
                    <tr key={proposal.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-3 font-mono font-bold text-[10px] text-slate-500">
                        COT-{proposal.id.slice(0, 6).toUpperCase()}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-800 block text-sm uppercase truncate">
                          {companyName || lead?.companyName || "Desconocido"}
                        </span>
                      </td>
                      <td className="p-3 text-slate-650 truncate">
                        {opportunity?.title || proposal.title}
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-slate-100 border border-slate-200 text-slate-650 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                          v{proposal.version}.0
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-slate-900">{formatCOP(proposal.totalValue)}</span>
                          {expired && (
                            <span className="bg-amber-50 text-amber-700 border border-amber-250 text-[8px] px-1 py-0.2 rounded font-bold uppercase tracking-tight mt-0.5 animate-pulse">
                              Oferta Expirada
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {getStatusBadge(proposal.status)}
                      </td>
                      <td className="p-3 text-center">
                        <Link 
                          href={`/crm/propuestas/${proposal.id}`}
                          className="inline-flex items-center justify-center p-1.5 text-slate-650 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* MOBILE VIEW: Stacked Cards */}
            <div className="md:hidden p-4 space-y-4">
              {filteredProps.map(({ proposal, lead, companyName, opportunity }) => {
                const expired = isProposalExpired(proposal);
                return (
                  <div 
                    key={proposal.id} 
                    className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="font-mono text-[9px] text-slate-400 font-bold bg-slate-50 px-1 border border-slate-200 rounded">
                            COT-{proposal.id.slice(0, 6).toUpperCase()}
                          </span>
                          <span className="font-mono text-[9px] text-slate-450 font-bold">
                            v{proposal.version}.0
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm uppercase truncate">
                          {companyName || lead?.companyName || "Desconocido"}
                        </h4>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {opportunity?.title || proposal.title}
                        </p>
                      </div>
                      
                      <Link 
                        href={`/crm/propuestas/${proposal.id}`}
                        className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600 shrink-0 self-center"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                      <div>
                        {getStatusBadge(proposal.status)}
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Total Cotizado:</span>
                        <div className="flex items-center gap-1 justify-end">
                          {expired && (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[8px] px-1 py-0.2 rounded font-bold uppercase tracking-tight">
                              Expirada
                            </span>
                          )}
                          <span className="text-xs font-bold text-slate-900">
                            {formatCOP(proposal.totalValue)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}
      </div>

      {/* NEW PROPOSAL MODAL (Borrador) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-md p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide mb-4">Nueva Propuesta Comercial</h3>
            
            {error && (
              <div className="bg-red-50 text-red-700 text-xs p-2.5 rounded border border-red-200 mb-4 font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </div>
            )}
            
            <form onSubmit={handleCreateProposal} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Lead / Proyecto Activo *</label>
                <select 
                  required
                  value={form.leadId} 
                  onChange={e => setForm({...form, leadId: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-400 text-xs bg-white"
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
                <label className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Título de la Propuesta *</label>
                <input 
                  required 
                  type="text"
                  placeholder="Ej: Propuesta Ventilación Nave de Ácidos"
                  value={form.title} 
                  onChange={e => setForm({...form, title: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-400 text-xs" 
                />
              </div>

              <div>
                <label className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Monto Total Estimado (COP) *</label>
                <input 
                  required 
                  type="number"
                  value={form.totalValue || ""} 
                  onChange={e => setForm({...form, totalValue: Number(e.target.value)})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-400 text-xs" 
                />
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
                ) : "Crear Borrador de Propuesta"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
