"use client";

import React, { useState, useTransition, useEffect } from "react";
import { logoutAction } from "@/lib/server-actions/auth";
import { requestTechnicalServiceAction } from "@/lib/server-actions/portal";
import { mapCrmStageToPortal } from "@/lib/utils/portal-mapper";
import { 
  Briefcase, 
  FileText, 
  Settings, 
  ShieldCheck, 
  LogOut, 
  Building, 
  User, 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Download, 
  Plus, 
  MapPin, 
  Wind, 
  Calendar, 
  Info, 
  RefreshCw,
  TrendingUp,
  FileSpreadsheet
} from "lucide-react";

// Types from schema definitions
interface Customer {
  id: string;
  name: string;
  nit: string | null;
  status: string;
  ltv: number;
  assignedTo: string | null;
  recurrenceIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Plant {
  id: string;
  customerId: string;
  name: string;
  city: string;
  address: string | null;
  airflowCfm: number;
  createdAt: Date;
}

interface ServiceRequest {
  id: string;
  customerId: string;
  plantId: string | null;
  title: string;
  description: string;
  urgency: string;
  status: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Lead {
  id: string;
  companyName: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  serviceType: string;
  environmentType: string;
  urgencyLevel: string;
  status: string;
  createdAt: Date;
}

interface Proposal {
  id: string;
  leadId: string;
  title: string;
  version: number;
  totalValue: number;
  currency: string;
  status: string;
  pdfUrl: string | null;
  validUntil: Date | null;
  createdAt: Date;
}

interface TechnicalDocument {
  id: string;
  leadId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  customerId: string | null;
  createdAt: Date;
}

interface Diagnostic {
  id: string;
  leadId: string;
  plantId: string | null;
  airflow: number | null;
  createdAt: Date;
}

interface ActivityLog {
  id: string;
  leadId: string;
  activityType: string;
  description: string;
  createdAt: Date;
}

interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  entityAffected: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

interface PortalClientProps {
  customer: Customer;
  plants: Plant[];
  serviceRequests: ServiceRequest[];
  leads: Lead[];
  proposals: Proposal[];
  documents: TechnicalDocument[];
  diagnostics: Diagnostic[];
  activities: ActivityLog[];
  audits: AuditLog[];
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
  isImpersonating?: boolean;
}

export default function PortalClient({
  customer,
  plants,
  serviceRequests,
  leads,
  proposals,
  documents,
  diagnostics,
  activities,
  audits,
  user,
  isImpersonating = false,
}: PortalClientProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "requests" | "comercial" | "ingenieria" | "actividad">("dashboard");
  const [isPending, startTransition] = useTransition();

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<"baja" | "media" | "alta" | "critica">("media");
  const [serviceType, setServiceType] = useState<string>("mantenimiento");
  const [plantId, setPlantId] = useState<string>("");
  const [newPlantName, setNewPlantName] = useState("");
  const [city, setCity] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [offlineCachedData, setOfflineCachedData] = useState<any>(null);

  // Form Reset Helper
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setUrgency("media");
    setServiceType("mantenimiento");
    setPlantId("");
    setNewPlantName("");
    setCity("");
  };

  // Format Helper functions complying with Pilar IV
  const formatCOP = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val)) return "$0 COP";
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(val);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "Sin información registrada";
    return new Date(date).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatCFM = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val)) return "0 CFM";
    return `${val.toLocaleString("es-CO")} CFM`;
  };

  // Status badges mapping
  const getUrgencyBadge = (level: string) => {
    switch (level?.toLowerCase()) {
      case "critica":
        return <span className="bg-rose-950/40 text-rose-400 border border-rose-800/30 text-[10px] px-2 py-0.5 rounded uppercase font-mono">Crítica</span>;
      case "alta":
        return <span className="bg-amber-950/40 text-amber-400 border border-amber-800/30 text-[10px] px-2 py-0.5 rounded uppercase font-mono">Alta</span>;
      case "media":
        return <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-800/30 text-[10px] px-2 py-0.5 rounded uppercase font-mono">Media</span>;
      default:
        return <span className="bg-slate-800 text-slate-400 border border-slate-700/50 text-[10px] px-2 py-0.5 rounded uppercase font-mono">Baja</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "abierta":
      case "nuevo":
        return <span className="bg-cyan-950/40 text-cyan-400 border border-cyan-800/30 text-[10px] px-2 py-0.5 rounded uppercase font-mono">Abierta</span>;
      case "asignada":
      case "contacto":
      case "reunion":
        return <span className="bg-violet-950/40 text-violet-400 border border-violet-800/30 text-[10px] px-2 py-0.5 rounded uppercase font-mono">Asignada</span>;
      case "en_proceso":
      case "diagnostico":
      case "propuesta_prep":
        return <span className="bg-amber-950/40 text-amber-400 border border-amber-800/30 text-[10px] px-2 py-0.5 rounded uppercase font-mono">En Proceso</span>;
      case "cerrada":
      case "ganado":
        return <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-800/30 text-[10px] px-2 py-0.5 rounded uppercase font-mono">Completada</span>;
      default:
        return <span className="bg-rose-950/40 text-rose-400 border border-rose-800/30 text-[10px] px-2 py-0.5 rounded uppercase font-mono">Archivada</span>;
    }
  };

  // Offline submission handler (Pilar XII)
  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const data = {
      title,
      description,
      urgency,
      plantId: plantId === "NEW" ? null : plantId || null,
      newPlantName: plantId === "NEW" ? newPlantName : null,
      city: plantId === "NEW" ? city : null,
      serviceType,
    };

    // Check online status
    if (typeof window !== "undefined" && !window.navigator.onLine) {
      setOfflineCachedData(data);
      localStorage.setItem("cyh_pending_service_request", JSON.stringify(data));
      setFormError("Error de conexión. Su solicitud fue guardada temporalmente. Reintentar.");
      return;
    }

    startTransition(async () => {
      const res = await requestTechnicalServiceAction(data);
      if (res.success) {
        setFormSuccess("Solicitud de asistencia registrada exitosamente.");
        localStorage.removeItem("cyh_pending_service_request");
        setOfflineCachedData(null);
        resetForm();
      } else {
        setFormError(res.error);
      }
    });
  };

  const handleOfflineRetry = () => {
    if (typeof window !== "undefined" && !window.navigator.onLine) {
      setFormError("Aún no detectamos conexión a internet. Inténtelo nuevamente en unos momentos.");
      return;
    }

    const cached = localStorage.getItem("cyh_pending_service_request");
    if (!cached) return;

    const parsed = JSON.parse(cached);
    setFormError(null);

    startTransition(async () => {
      const res = await requestTechnicalServiceAction(parsed);
      if (res.success) {
        setFormSuccess("Solicitud pendiente enviada exitosamente.");
        localStorage.removeItem("cyh_pending_service_request");
        setOfflineCachedData(null);
        resetForm();
      } else {
        setFormError(res.error);
      }
    });
  };

  // Load cached offline requests
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("cyh_pending_service_request");
      if (cached) {
        setOfflineCachedData(JSON.parse(cached));
        setFormError("Tiene una solicitud guardada sin enviar por falta de red. Conéctese y presione Reintentar.");
      }
    }
  }, []);

  // Compute stats
  const totalCFM = plants.reduce((acc, p) => acc + (p.airflowCfm || 0), 0);
  const activeProposals = proposals.filter(p => ["aceptada", "enviada", "negociacion"].includes(p.status));
  const estimatedInvestment = proposals.reduce((acc, p) => acc + (p.totalValue || 0), 0);
  const lastInspectionDate = diagnostics.length > 0 ? diagnostics[0].createdAt : null;

  // Merged activity feed
  const activityFeed = [
    ...activities.map(a => ({
      date: new Date(a.createdAt),
      type: "CRM",
      desc: a.description,
    })),
    ...audits.map(au => ({
      date: new Date(au.createdAt),
      type: "Audit",
      desc: `Actividad registrada: ${au.action.replace(/_/g, " ")}`,
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {isImpersonating && (
        <div className="bg-amber-950/70 text-amber-300 border-b border-amber-800/40 text-[11px] px-6 py-2 flex items-center gap-2 font-mono font-semibold">
          <AlertTriangle className="h-4 w-4 text-amber-400 animate-pulse shrink-0" />
          <span>MODO SUPERVISIÓN: Visualizando la plataforma exactamente como la ve el cliente. Todas las acciones técnicas y descargas quedan registradas bajo auditoría.</span>
        </div>
      )}
      {/* Siemens / ABB High density Header */}
      <header className="border-b border-slate-800 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-500/10 p-2 rounded border border-emerald-500/25">
            <Building className="h-5.5 w-5.5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-md font-bold tracking-wider text-slate-100 uppercase font-mono">CYH OS</span>
              <span className="text-[10px] bg-slate-800 border border-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded font-mono font-semibold">B2B PORTAL</span>
            </div>
            <span className="text-slate-400 text-xs font-semibold block uppercase tracking-wider leading-none">
              {customer.name} {customer.nit ? `| NIT ${customer.nit}` : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden lg:flex items-center space-x-2 bg-slate-950/80 px-3 py-1 rounded border border-slate-800">
            <User className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-300">{user.fullName}</span>
            <span className="bg-emerald-950 text-emerald-400 text-[9px] uppercase px-1.5 py-0.5 rounded border border-emerald-800/30 font-mono">
              {user.role}
            </span>
          </div>
          
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex items-center space-x-1.5 text-xs font-bold text-slate-400 hover:text-rose-400 bg-slate-900/60 hover:bg-rose-950/20 border border-slate-800 hover:border-rose-900/30 px-3 py-1.5 rounded transition-all duration-150"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </form>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col gap-6">
        
        {/* KPI Panel Grid (Siemens ABB style) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded p-4 flex flex-col justify-between min-h-[100px]">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] uppercase tracking-wider font-semibold font-mono">Soporte Operativo</span>
              <Wind className="h-4.5 w-4.5 text-emerald-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-white block">{plants.length} Plantas</span>
              <span className="text-[11px] text-slate-500 font-mono leading-none">Capacidad: {formatCFM(totalCFM)}</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded p-4 flex flex-col justify-between min-h-[100px]">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] uppercase tracking-wider font-semibold font-mono">Salud del Sistema</span>
              <Calendar className="h-4.5 w-4.5 text-cyan-400" />
            </div>
            <div className="mt-2">
              <span className="text-xs font-bold text-slate-200 block truncate leading-tight">Última Inspección</span>
              <span className="text-md font-bold font-mono tracking-tight text-cyan-400 block mt-0.5">
                {lastInspectionDate ? formatDate(lastInspectionDate) : "Sin inspección"}
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded p-4 flex flex-col justify-between min-h-[100px]">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] uppercase tracking-wider font-semibold font-mono">Operaciones Activas</span>
              <Activity className="h-4.5 w-4.5 text-amber-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-white block">
                {serviceRequests.filter(r => r.status !== "cerrada").length + leads.filter(l => l.status !== "ganado" && l.status !== "perdido").length} Activos
              </span>
              <span className="text-[11px] text-slate-500 font-mono leading-none">
                {serviceRequests.length} Solicitudes | {leads.length} Proyectos
              </span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded p-4 flex flex-col justify-between min-h-[100px]">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] uppercase tracking-wider font-semibold font-mono">Inversión Estimada</span>
              <TrendingUp className="h-4.5 w-4.5 text-teal-400" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-bold font-mono tracking-tight text-white block truncate">{formatCOP(estimatedInvestment)}</span>
              <span className="text-[10px] text-slate-500 leading-none flex items-center gap-1 font-mono">
                <Info className="h-3 w-3 text-slate-500 inline" />
                Precisión estimada: ±20%
              </span>
            </div>
          </div>
        </section>

        {/* Tab Navigator */}
        <div className="flex border-b border-slate-800 bg-slate-900/20 px-2 pt-2 rounded-t gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider font-mono rounded-t border-t border-x transition-all duration-100 ${
              activeTab === "dashboard"
                ? "bg-slate-900 border-slate-800 text-white font-bold"
                : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider font-mono rounded-t border-t border-x transition-all duration-100 ${
              activeTab === "requests"
                ? "bg-slate-900 border-slate-800 text-white font-bold"
                : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Solicitudes & Asistencia
          </button>
          <button
            onClick={() => setActiveTab("comercial")}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider font-mono rounded-t border-t border-x transition-all duration-100 ${
              activeTab === "comercial"
                ? "bg-slate-900 border-slate-800 text-white font-bold"
                : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Comercial
          </button>
          <button
            onClick={() => setActiveTab("ingenieria")}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider font-mono rounded-t border-t border-x transition-all duration-100 ${
              activeTab === "ingenieria"
                ? "bg-slate-900 border-slate-800 text-white font-bold"
                : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Ingeniería (Documentación)
          </button>
          <button
            onClick={() => setActiveTab("actividad")}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider font-mono rounded-t border-t border-x transition-all duration-100 ${
              activeTab === "actividad"
                ? "bg-slate-900 border-slate-800 text-white font-bold"
                : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Actividad Reciente
          </button>
        </div>

        {/* Dynamic Panels */}
        <section className="bg-slate-900/30 border border-slate-800/80 rounded-b p-6 flex-1">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Projects / Sizing */}
                <div className="border border-slate-800 bg-slate-900/40 rounded p-5">
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono border-b border-slate-800 pb-3 text-slate-200 mb-4 flex items-center justify-between">
                    <span>Proyectos Activos & Rediseño</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">{leads.length}</span>
                  </h3>
                  {leads.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500">
                      No hay proyectos activos en ejecución.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {leads.map((l) => (
                        <div key={l.id} className="bg-slate-950 p-4 rounded border border-slate-800/80 flex flex-col sm:flex-row justify-between gap-4">
                          <div>
                            <span className="text-xs font-bold text-white block">{l.serviceType.toUpperCase()} - {l.environmentType}</span>
                            <span className="text-[10px] text-slate-500 font-mono block mt-1">ID: {l.id} | Iniciado: {formatDate(l.createdAt)}</span>
                            <span className="text-[11px] text-slate-400 block mt-2">{l.city} | Urgencia: <span className="capitalize text-slate-300 font-semibold">{l.urgencyLevel}</span></span>
                          </div>
                          <div className="flex flex-col items-start sm:items-end justify-between">
                            <span className="bg-teal-950 text-teal-400 border border-teal-800/30 text-[10px] px-2 py-0.5 rounded uppercase font-mono font-semibold">
                              Fase: {mapCrmStageToPortal(l.status)}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono mt-2 sm:mt-0">CRM: {l.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Plants Telemetry */}
                <div className="border border-slate-800 bg-slate-900/40 rounded p-5">
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono border-b border-slate-800 pb-3 text-slate-200 mb-4 flex items-center justify-between">
                    <span>Instalaciones e Instrumentación</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">{plants.length}</span>
                  </h3>
                  {plants.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500">
                      No hay plantas registradas.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400">
                            <th className="pb-2 font-semibold">Planta</th>
                            <th className="pb-2 font-semibold">Ciudad</th>
                            <th className="pb-2 font-semibold text-right">Flujo Medido</th>
                          </tr>
                        </thead>
                        <tbody>
                          {plants.map((p) => (
                            <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-900/20">
                              <td className="py-2.5 font-bold text-white">{p.name}</td>
                              <td className="py-2.5 text-slate-400">{p.city}</td>
                              <td className="py-2.5 text-right font-mono text-emerald-400 font-semibold">{formatCFM(p.airflowCfm)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REQUESTS & TECHNICAL ASSISTANCE */}
          {activeTab === "requests" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form panel */}
              <div className="lg:col-span-1 border border-slate-800 bg-slate-900/40 rounded p-5">
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono border-b border-slate-800 pb-3 text-slate-200 mb-4">
                  Nueva Solicitud de Asistencia
                </h3>

                {formError && (
                  <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800/30 rounded text-rose-400 text-[11px] font-semibold flex items-center justify-between">
                    <span>{formError}</span>
                    {offlineCachedData && (
                      <button 
                        onClick={handleOfflineRetry}
                        className="bg-rose-900 text-white px-2 py-0.5 rounded hover:bg-rose-800 flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Reintentar
                      </button>
                    )}
                  </div>
                )}

                {formSuccess && (
                  <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-800/30 rounded text-emerald-400 text-[11px] font-semibold">
                    {formSuccess}
                  </div>
                )}

                <form onSubmit={handleServiceSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-400 font-mono mb-1 uppercase font-bold text-[10px]">Asunto / Tipo de Falla</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ej. Extractor axial sobrecalentado"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white placeholder-slate-600 focus:border-slate-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-mono mb-1 uppercase font-bold text-[10px]">Descripción Detallada</label>
                    <textarea
                      required
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detalle los síntomas, ruidos extraños, fallas térmicas o el comportamiento anómalo detectado..."
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white placeholder-slate-600 focus:border-slate-700 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 font-mono mb-1 uppercase font-bold text-[10px]">Nivel de Urgencia</label>
                      <select
                        value={urgency}
                        onChange={(e) => setUrgency(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:border-slate-700 focus:outline-none"
                      >
                        <option value="baja">Baja</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                        <option value="critica">Crítica (Detención)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 font-mono mb-1 uppercase font-bold text-[10px]">Tipo de Servicio</label>
                      <select
                        value={serviceType}
                        onChange={(e) => setServiceType(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:border-slate-700 focus:outline-none"
                      >
                        <option value="mantenimiento">Mantenimiento</option>
                        <option value="reparacion">Reparación / Falla</option>
                        <option value="climatizacion">Climatización</option>
                        <option value="ventilacion">Ventilación General</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-mono mb-1 uppercase font-bold text-[10px]">Planta Afectada</label>
                    <select
                      value={plantId}
                      required
                      onChange={(e) => setPlantId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:border-slate-700 focus:outline-none"
                    >
                      <option value="">-- Seleccione una Planta --</option>
                      {plants.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.city})</option>
                      ))}
                      <option value="NEW">+ Registrar Nueva Planta</option>
                    </select>
                  </div>

                  {plantId === "NEW" && (
                    <div className="bg-slate-950 p-4 border border-slate-800 rounded space-y-3 mt-2">
                      <div>
                        <label className="block text-slate-400 font-mono mb-1 uppercase font-bold text-[9px]">Nombre de Planta</label>
                        <input
                          type="text"
                          required
                          value={newPlantName}
                          onChange={(e) => setNewPlantName(e.target.value)}
                          placeholder="Ej. Planta Bodega Norte"
                          className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white placeholder-slate-700 focus:border-slate-700 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-mono mb-1 uppercase font-bold text-[9px]">Ciudad</label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Ej. Barranquilla"
                          className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white placeholder-slate-700 focus:border-slate-700 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-white hover:bg-slate-200 disabled:bg-slate-800 text-slate-900 disabled:text-slate-600 font-bold uppercase py-2.5 rounded tracking-wide transition-colors flex items-center justify-center gap-2 mt-4"
                  >
                    {isPending ? "Procesando..." : <>Enviar Solicitud <Plus className="h-4 w-4" /></>}
                  </button>
                </form>
              </div>

              {/* List panel */}
              <div className="lg:col-span-2 border border-slate-800 bg-slate-900/40 rounded p-5">
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono border-b border-slate-800 pb-3 text-slate-200 mb-4 flex items-center justify-between">
                  <span>Historial de Solicitudes Técnicas</span>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">{serviceRequests.length}</span>
                </h3>

                {serviceRequests.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-500">
                    No registra solicitudes de servicio técnico previas.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {serviceRequests.map((req) => {
                      const plantName = plants.find((p) => p.id === req.plantId)?.name || "Nueva Instalación";
                      return (
                        <div key={req.id} className="bg-slate-950 p-4 rounded border border-slate-800/80 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-white">{req.title}</span>
                              {getUrgencyBadge(req.urgency)}
                              {getStatusBadge(req.status)}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{req.description}</p>
                            <span className="text-[10px] text-slate-500 font-mono block mt-2">
                              Planta: <span className="text-slate-300 font-semibold">{plantName}</span> | Fecha: {formatDate(req.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: COMERCIAL */}
          {activeTab === "comercial" && (
            <div className="border border-slate-800 bg-slate-900/40 rounded p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono border-b border-slate-800 pb-3 text-slate-200 mb-4 flex items-center justify-between">
                <span>Propuestas y Cotizaciones Recientes</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">{proposals.length}</span>
              </h3>

              {proposals.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500">
                  No hay cotizaciones registradas para su cuenta corporativa.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-2 font-semibold">Título de la Propuesta</th>
                        <th className="pb-2 font-semibold">Versión</th>
                        <th className="pb-2 font-semibold">Fecha de Creación</th>
                        <th className="pb-2 font-semibold">Válida Hasta</th>
                        <th className="pb-2 font-semibold">Total Estimado</th>
                        <th className="pb-2 font-semibold text-center">Estado</th>
                        <th className="pb-2 font-semibold text-right">Descargar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposals.map((prop) => (
                        <tr key={prop.id} className="border-b border-slate-800/50 hover:bg-slate-900/20">
                          <td className="py-3 font-bold text-white">{prop.title}</td>
                          <td className="py-3 font-mono text-slate-400">V{prop.version}</td>
                          <td className="py-3 text-slate-400">{formatDate(prop.createdAt)}</td>
                          <td className="py-3 text-slate-400">{prop.validUntil ? formatDate(prop.validUntil) : "N/D"}</td>
                          <td className="py-3 font-mono text-emerald-400 font-bold">{formatCOP(prop.totalValue)}</td>
                          <td className="py-3 text-center">
                            {prop.status === "aceptada" ? (
                              <span className="bg-emerald-950 text-emerald-400 border border-emerald-800/30 text-[9px] px-2 py-0.5 rounded uppercase font-mono font-semibold">Aceptada</span>
                            ) : prop.status === "rechazada" ? (
                              <span className="bg-rose-950 text-rose-400 border border-rose-800/30 text-[9px] px-2 py-0.5 rounded uppercase font-mono font-semibold">Rechazada</span>
                            ) : (
                              <span className="bg-amber-950 text-amber-400 border border-amber-800/30 text-[9px] px-2 py-0.5 rounded uppercase font-mono font-semibold">Presentada</span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            {prop.pdfUrl ? (
                              <a
                                href={prop.pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center space-x-1 text-slate-400 hover:text-white transition-colors bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded p-1.5"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </a>
                            ) : (
                              <span className="text-slate-600 text-[10px] font-mono select-none">No disponible</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DOCUMENT CENTER */}
          {activeTab === "ingenieria" && (
            <div className="border border-slate-800 bg-slate-900/40 rounded p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono border-b border-slate-800 pb-3 text-slate-200 mb-4 flex items-center justify-between">
                <span>Centro de Documentación de Ingeniería</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">{documents.length}</span>
              </h3>

              {documents.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500">
                  No se registran documentos técnicos o planos de ingeniería para su cuenta.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-2 font-semibold">Nombre del Archivo</th>
                        <th className="pb-2 font-semibold">Extensión</th>
                        <th className="pb-2 font-semibold">Fecha de Subida</th>
                        <th className="pb-2 font-semibold text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => (
                        <tr key={doc.id} className="border-b border-slate-800/50 hover:bg-slate-900/20">
                          <td className="py-3 font-bold text-white flex items-center gap-2">
                            <FileSpreadsheet className="h-4.5 w-4.5 text-cyan-400" />
                            {doc.fileName}
                          </td>
                          <td className="py-3 font-mono text-slate-400 uppercase">{doc.fileType || "PDF"}</td>
                          <td className="py-3 text-slate-400">{formatDate(doc.createdAt)}</td>
                          <td className="py-3 text-right">
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded px-2.5 py-1.5 transition-colors font-mono"
                            >
                              <Download className="h-3 w-3" />
                              <span>Descargar</span>
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: RECENT ACTIVITY */}
          {activeTab === "actividad" && (
            <div className="border border-slate-800 bg-slate-900/40 rounded p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono border-b border-slate-800 pb-3 text-slate-200 mb-4">
                Historial de Actividades Recientes
              </h3>

              {activityFeed.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500">
                  Sin registros de actividad reciente.
                </div>
              ) : (
                <div className="space-y-4">
                  {activityFeed.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-start text-xs border-b border-slate-800/40 pb-3">
                      <div className="bg-slate-950 p-2 border border-slate-800 rounded mt-0.5">
                        {item.type === "CRM" ? (
                          <Activity className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-500 font-mono block">{formatDate(item.date)}</span>
                        <p className="text-slate-300 font-medium mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 px-6 py-4 text-center text-xs text-slate-500 font-mono mt-8">
        © 2026 CYH - Ventilación Mecánica Industrial. Todos los derechos reservados.
      </footer>
    </div>
  );
}
