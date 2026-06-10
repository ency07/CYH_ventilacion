"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { 
  Search, Plus, X, UserCheck, Activity, Coins, ShieldAlert,
  ChevronRight, Building2, Filter, AlertCircle, LayoutGrid, List
} from "lucide-react";
import { createCustomerAction } from "@/lib/server-actions/customers";
import { crmCustomers, crmCustomerPlants, crmCustomerContacts, crmUsers } from "@/lib/db/schema";

interface ClientesClientProps {
  initialCustomers: (typeof crmCustomers.$inferSelect & {
    plants: (typeof crmCustomerPlants.$inferSelect)[];
    contacts: (typeof crmCustomerContacts.$inferSelect)[];
  })[];
  salesReps: (typeof crmUsers.$inferSelect)[];
  kpis: {
    activeCustomers: number;
    monitoredPlants: number;
    commercialLtv: number;
    recurrenceIndex: number;
  };
  userRole: string;
  isAdmin: boolean;
  isTecnico: boolean;
  initialQuery: string;
  initialEstado: string;
}

export default function ClientesClient({
  initialCustomers,
  salesReps,
  kpis,
  userRole,
  isAdmin,
  isTecnico,
  initialQuery,
  initialEstado,
}: ClientesClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "list";

  const [search, setSearch] = useState(initialQuery);
  const [estado, setEstado] = useState(initialEstado);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // New Customer Form State
  const [name, setName] = useState("");
  const [nit, setNit] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [statusVal, setStatusVal] = useState("activo");

  const updateFilters = (newSearch: string, newEstado: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newSearch) {
      params.set("q", newSearch);
    } else {
      params.delete("q");
    }
    if (newEstado && newEstado !== "all") {
      params.set("estado", newEstado);
    } else if (newEstado === "all") {
      params.set("estado", "all");
    } else {
      params.delete("estado");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    updateFilters(e.target.value, estado);
  };

  const handleEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEstado(e.target.value);
    updateFilters(search, e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");

    startTransition(async () => {
      const res = await createCustomerAction({
        name,
        nit: nit.trim() || undefined,
        assignedTo: assignedTo || undefined,
        status: statusVal,
      });

      if (res.success) {
        setIsModalOpen(false);
        setName("");
        setNit("");
        setAssignedTo("");
        setStatusVal("activo");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="flex flex-col h-auto min-h-screen md:h-[calc(100vh-4rem)] bg-bg-secondary p-6 font-sans overflow-visible md:overflow-hidden">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-text-primary uppercase tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-accent-cyan" />
            Directorio de Cuentas B2B
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Gestión centralizada de clientes corporativos, plantas industriales y KPIs de fidelización.
          </p>
        </div>

        {!isTecnico && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-text-primary text-bg-primary text-xs font-bold uppercase tracking-wider rounded border border-transparent hover:bg-bg-primary hover:text-text-primary hover:border-border-subtle transition-all duration-200 shadow"
          >
            <Plus className="w-4 h-4" /> Nuevo Cliente
          </button>
        )}
      </div>

      {/* KPI STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 shrink-0">
        {/* KPI 1: Clientes Activos */}
        <div className="bg-bg-primary border border-border-subtle rounded-md p-4 flex items-center justify-between shadow-sm hover:border-accent-cyan/30 transition-all">
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Clientes Activos</p>
            <p className="text-2xl font-bold text-text-primary mt-1 font-mono">{kpis.activeCustomers}</p>
          </div>
          <div className="p-2.5 bg-success-subtle/10 rounded-md border border-success/20">
            <UserCheck className="w-5 h-5 text-success" />
          </div>
        </div>

        {/* KPI 2: Plantas Monitoreadas */}
        <div className="bg-bg-primary border border-border-subtle rounded-md p-4 flex items-center justify-between shadow-sm hover:border-accent-cyan/30 transition-all">
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Plantas Monitoreadas</p>
            <p className="text-2xl font-bold text-text-primary mt-1 font-mono">{kpis.monitoredPlants}</p>
          </div>
          <div className="p-2.5 bg-accent-cyan-soft/10 rounded-md border border-accent-cyan/20">
            <Activity className="w-5 h-5 text-accent-cyan" />
          </div>
        </div>

        {/* KPI 3: LTV Comercial */}
        {!isTecnico ? (
          <div className="bg-bg-primary border border-border-subtle rounded-md p-4 flex items-center justify-between shadow-sm hover:border-accent-cyan/30 transition-all">
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">LTV Comercial</p>
              <p className="text-2xl font-bold text-text-primary mt-1 font-mono">
                ${kpis.commercialLtv.toLocaleString("es-CO")} <span className="text-xs text-text-muted">COP</span>
              </p>
            </div>
            <div className="p-2.5 bg-info-subtle/10 rounded-md border border-info/20">
              <Coins className="w-5 h-5 text-info" />
            </div>
          </div>
        ) : (
          <div className="bg-bg-primary border border-border-subtle rounded-md p-4 flex items-center justify-between shadow-sm opacity-50">
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">LTV Comercial</p>
              <p className="text-sm font-semibold text-text-muted mt-2 uppercase tracking-wider">
                Restringido [Técnico]
              </p>
            </div>
            <div className="p-2.5 bg-bg-secondary rounded-md border border-border-subtle">
              <ShieldAlert className="w-5 h-5 text-text-muted" />
            </div>
          </div>
        )}

        {/* KPI 4: Índice de Recurrencia */}
        <div className="bg-bg-primary border border-border-subtle rounded-md p-4 flex items-center justify-between shadow-sm hover:border-accent-cyan/30 transition-all">
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Índice de Recurrencia</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold text-text-primary font-mono">{kpis.recurrenceIndex}%</p>
              <span className="text-[9px] font-medium text-text-muted">Lealtad</span>
            </div>
          </div>
          <div className="p-2.5 bg-warning-subtle/10 rounded-md border border-warning/20">
            <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H12v9l-6-6" />
            </svg>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="bg-bg-primary border border-border-subtle rounded-t-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 text-text-secondary">
            <Filter className="w-4 h-4 text-accent-cyan" />
            <span className="text-xs font-bold uppercase tracking-wider">Filtros</span>
          </div>

          <div className="w-px h-5 bg-border-subtle hidden md:block" />

          {/* Contract Status Dropdown */}
          <div className="relative w-full md:w-48">
            <select
              value={estado}
              onChange={handleEstadoChange}
              className="w-full bg-bg-secondary border border-border-subtle rounded px-2.5 py-1 text-xs text-text-primary focus:outline-none focus:border-accent-cyan/60"
            >
              <option value="activo">Estado: Activos</option>
              <option value="inactivo">Estado: Inactivos</option>
              <option value="all">Ver Todos</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Name / NIT Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar por nombre o NIT..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-bg-secondary border border-border-subtle rounded text-text-primary focus:outline-none focus:border-accent-cyan transition-colors"
            />
          </div>

          {/* View Switcher */}
          <div className="flex items-center gap-1.5 border border-border-subtle rounded p-1 bg-bg-secondary shrink-0 select-none">
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("view", "list");
                router.push(`${pathname}?${params.toString()}`);
              }}
              title="Vista de Tabla"
              className={`p-1 rounded transition-colors ${
                currentView === "list"
                  ? "bg-accent-cyan text-bg-primary"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("view", "grid");
                router.push(`${pathname}?${params.toString()}`);
              }}
              title="Vista de Tarjetas"
              className={`p-1 rounded transition-colors ${
                currentView === "grid"
                  ? "bg-accent-cyan text-bg-primary"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MASTER HIGH-DENSITY CUSTOMERS TABLE (Siemens/ABB Industrial Grid) */}
      <div className="flex-1 overflow-visible md:overflow-auto bg-bg-primary border-x border-b border-border-subtle rounded-b-lg shadow-sm relative">
        {currentView === "list" ? (
          <>
            {/* Desktop View (Table) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-bg-secondary z-20 border-b border-border-subtle">
                  <tr className="divide-x divide-border-subtle/50">
                    <th className="p-3 pl-5 text-[10px] font-bold text-text-muted uppercase tracking-wider w-1/4">Nombre Comercial</th>
                    <th className="p-3 text-[10px] font-bold text-text-muted uppercase tracking-wider w-1/6">NIT</th>
                    <th className="p-3 text-[10px] font-bold text-text-muted uppercase tracking-wider w-1/12 text-center">Plantas</th>
                    <th className="p-3 text-[10px] font-bold text-text-muted uppercase tracking-wider w-1/4">Asesor Asignado</th>
                    {!isTecnico && (
                      <th className="p-3 text-[10px] font-bold text-text-muted uppercase tracking-wider w-1/6 text-right">LTV Comercial</th>
                    )}
                    <th className="p-3 text-[10px] font-bold text-text-muted uppercase tracking-wider w-1/12 text-center">Estado</th>
                    <th className="p-3 pr-5 text-[10px] font-bold text-text-muted uppercase tracking-wider w-1/12 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/70">
                  {initialCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={isTecnico ? 6 : 7} className="p-10 text-center text-xs text-text-muted uppercase tracking-wide">
                        No se encontraron cuentas corporativas que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    initialCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-bg-secondary/40 transition-colors duration-150 divide-x divide-border-subtle/30 group">
                        {/* Account Name */}
                        <td className="p-2.5 pl-5 font-semibold text-text-primary text-xs relative">
                          <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-r transition-all group-hover:w-1.5 ${
                            customer.status === "activo" ? "bg-accent-cyan" : "bg-text-muted/40"
                          }`}></div>
                          <span className="truncate block ml-2">{customer.name}</span>
                        </td>

                        {/* NIT with warning badge if missing */}
                        <td className="p-2.5 text-xs">
                          {customer.nit ? (
                            <span className="font-mono text-text-secondary">{customer.nit}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-warning-subtle/10 text-warning border border-warning/20 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">
                              <AlertCircle className="w-2.5 h-2.5" /> Falta NIT
                            </span>
                          )}
                        </td>

                        {/* Plants count */}
                        <td className="p-2.5 text-xs text-center font-mono font-medium text-text-secondary">
                          {customer.plants?.length || 0}
                        </td>

                        {/* Assigned Advisor */}
                        <td className="p-2.5 text-xs text-text-secondary truncate">
                          {customer.assignedTo || "Sin asignar"}
                        </td>

                        {/* LTV (Commercial value) */}
                        {!isTecnico && (
                          <td className="p-2.5 text-xs text-right font-mono font-medium text-text-primary">
                            ${customer.ltv.toLocaleString("es-CO")}
                          </td>
                        )}

                        {/* Status Badge */}
                        <td className="p-2.5 text-center">
                          <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            customer.status === "activo" 
                              ? "bg-success-subtle/10 text-success border border-success/20" 
                              : "bg-danger-subtle/10 text-danger border border-danger/20"
                          }`}>
                            {customer.status}
                          </span>
                        </td>

                        {/* View action button */}
                        <td className="p-2 text-center">
                          <button
                            onClick={() => router.push(`/crm/clientes/${customer.id}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-bg-secondary border border-border-subtle hover:border-accent-cyan hover:bg-bg-primary rounded text-[10px] font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary transition-all duration-150"
                          >
                            Ver 360° <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View (Stacked Row Cards) */}
            <div className="block md:hidden space-y-4 p-4">
              {initialCustomers.length === 0 ? (
                <div className="text-center text-xs text-text-muted uppercase tracking-wide py-8">
                  No se encontraron cuentas corporativas que coincidan con la búsqueda.
                </div>
              ) : (
                initialCustomers.map((customer) => (
                  <div 
                    key={customer.id} 
                    className={`bg-bg-primary border border-border-subtle rounded p-4 shadow-sm flex flex-col gap-3 relative overflow-hidden w-full border-l-4 ${
                      customer.status === "activo" ? "border-l-accent-cyan" : "border-l-text-muted/40"
                    }`}
                  >
                    {/* Header: Name and Status */}
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs font-bold text-text-primary uppercase tracking-wide truncate max-w-[70%]">
                        {customer.name}
                      </span>
                      <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        customer.status === "activo" 
                          ? "bg-success-subtle/10 text-success border border-success/20" 
                          : "bg-danger-subtle/10 text-danger border border-danger/20"
                      }`}>
                        {customer.status}
                      </span>
                    </div>

                    {/* NIT and Plants count */}
                    <div className="text-[11px] text-text-secondary font-semibold grid grid-cols-2 gap-2 border-b border-border-subtle/30 pb-2">
                      <div>
                        <span className="text-[8px] text-text-muted uppercase tracking-wider block">NIT</span>
                        <span className="font-mono text-text-primary">
                          {customer.nit ? (
                            customer.nit
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-warning-subtle/10 text-warning border border-warning/20 text-[8px] font-bold uppercase px-1 py-0.25 rounded">
                              Falta NIT
                            </span>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] text-text-muted uppercase tracking-wider block">Plantas</span>
                        <span className="font-mono text-text-primary">{customer.plants?.length || 0}</span>
                      </div>
                    </div>

                    {/* Assigned advisor and LTV */}
                    <div className="text-[11px] text-text-secondary font-semibold grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[8px] text-text-muted uppercase tracking-wider block">Asesor Asignado</span>
                        <span className="text-text-primary truncate block">{customer.assignedTo || "Sin asignar"}</span>
                      </div>
                      {!isTecnico && (
                        <div>
                          <span className="text-[8px] text-text-muted uppercase tracking-wider block">LTV Comercial</span>
                          <span className="font-mono text-text-primary block">
                            ${customer.ltv.toLocaleString("es-CO")} COP
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action button */}
                    <div className="border-t border-border-subtle/30 pt-2 mt-1 flex justify-end">
                      <button
                        onClick={() => router.push(`/crm/clientes/${customer.id}`)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-bg-secondary border border-border-subtle hover:border-accent-cyan hover:bg-bg-primary rounded text-[10px] font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary transition-all duration-150"
                      >
                        Ver 360° <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* Grid View: Cards Grid for all devices */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 overflow-y-auto max-h-full">
            {initialCustomers.length === 0 ? (
              <div className="col-span-full text-center text-xs text-text-muted uppercase tracking-wide py-8">
                No se encontraron cuentas corporativas que coincidan con la búsqueda.
              </div>
            ) : (
              initialCustomers.map((customer) => (
                <div 
                  key={customer.id} 
                  className={`bg-bg-primary border border-border-subtle rounded p-4 shadow-sm flex flex-col justify-between gap-3 relative overflow-hidden w-full border-l-4 ${
                    customer.status === "activo" ? "border-l-accent-cyan" : "border-l-text-muted/40"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-bold text-text-primary uppercase tracking-wide truncate max-w-[70%]">
                      {customer.name}
                    </span>
                    <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      customer.status === "activo" 
                        ? "bg-success-subtle/10 text-success border border-success/20" 
                        : "bg-danger-subtle/10 text-danger border border-danger/20"
                    }`}>
                      {customer.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-text-secondary font-semibold grid grid-cols-2 gap-2 border-b border-border-subtle/30 pb-2">
                    <div>
                      <span className="text-[8px] text-text-muted uppercase tracking-wider block">NIT</span>
                      <span className="font-mono text-text-primary">
                        {customer.nit ? (
                          customer.nit
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-warning-subtle/10 text-warning border border-warning/20 text-[8px] font-bold uppercase px-1 py-0.25 rounded">
                            Falta NIT
                          </span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-[8px] text-text-muted uppercase tracking-wider block">Plantas</span>
                      <span className="font-mono text-text-primary">{customer.plants?.length || 0}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-text-secondary font-semibold grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[8px] text-text-muted uppercase tracking-wider block">Asesor Asignado</span>
                      <span className="text-text-primary truncate block">{customer.assignedTo || "Sin asignar"}</span>
                    </div>
                    {!isTecnico && (
                      <div>
                        <span className="text-[8px] text-text-muted uppercase tracking-wider block">LTV Comercial</span>
                        <span className="font-mono text-text-primary block">
                          ${customer.ltv.toLocaleString("es-CO")} COP
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border-subtle/30 pt-2 mt-1 flex justify-end">
                    <button
                      onClick={() => router.push(`/crm/clientes/${customer.id}`)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-bg-secondary border border-border-subtle hover:border-accent-cyan hover:bg-bg-primary rounded text-[10px] font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary transition-all duration-150"
                    >
                      Ver 360° <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* CREATE CLIENT MODAL DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-bg-primary border border-border-subtle rounded-md w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-text-primary uppercase tracking-wider mb-4 border-b border-border-subtle pb-2">
              Registrar Cuenta Corporativa B2B
            </h3>

            {error && (
              <div className="bg-danger-subtle/10 text-danger border border-danger/20 p-2.5 rounded text-xs mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
                  Razón Social / Nombre de Empresa *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ej: Siemens Colombia S.A."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-bg-secondary border border-border-subtle rounded px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-cyan"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
                  NIT (Número de Identificación Tributaria)
                </label>
                <input
                  type="text"
                  placeholder="Ej: 900.123.456-7"
                  value={nit}
                  onChange={(e) => setNit(e.target.value)}
                  className="w-full bg-bg-secondary border border-border-subtle rounded px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-cyan"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Asesor Asignado
                  </label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full bg-bg-secondary border border-border-subtle rounded px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-cyan"
                  >
                    <option value="">Sin Asignar</option>
                    {salesReps.map((rep) => (
                      <option key={rep.id} value={rep.email}>
                        {rep.fullName || rep.email.split("@")[0]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Estado Contractual
                  </label>
                  <select
                    value={statusVal}
                    onChange={(e) => setStatusVal(e.target.value)}
                    className="w-full bg-bg-secondary border border-border-subtle rounded px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-cyan"
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-border-subtle pt-4 mt-6">
                <button
                  disabled={isPending}
                  type="submit"
                  className="w-full py-2 bg-text-primary text-bg-primary text-xs font-bold uppercase tracking-wider rounded hover:opacity-95 transition-opacity disabled:opacity-50"
                >
                  {isPending ? "Procesando..." : "Crear Cliente B2B"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
