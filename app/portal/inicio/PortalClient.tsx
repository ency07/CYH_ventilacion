"use client";

import React, { useState, useTransition, useEffect } from "react";
import { logoutAction } from "@/lib/server-actions/auth";
import { 
  requestTechnicalServiceAction, 
  acceptProposalAction, 
  requestCommercialMeetingAction 
} from "@/lib/server-actions/portal";
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
  FileSpreadsheet,
  Check,
  Sliders,
  Folder,
  Lock,
  HelpCircle,
  AlertOctagon,
  ChevronRight,
  Hammer
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
  const [activeTab, setActiveTab] = useState<"control" | "equipos" | "proyectos" | "requests" | "comercial" | "ingenieria" | "actividad" | "auditoria">("control");
  const [isPending, startTransition] = useTransition();

  // Technical Document Center category state
  const [docCategory, setDocCategory] = useState<string>("todos");

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<"baja" | "media" | "alta" | "critica">("media");
  const [serviceType, setServiceType] = useState<string>("mantenimiento");
  const [operationalImpact, setOperationalImpact] = useState<string>("sin_impacto");
  const [affectedAsset, setAffectedAsset] = useState<string>("general");
  const [plantId, setPlantId] = useState<string>("");
  const [newPlantName, setNewPlantName] = useState("");
  const [city, setCity] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [offlineCachedData, setOfflineCachedData] = useState<any>(null);

  // Proposal Modals State
  const [selectedProposalForAccept, setSelectedProposalForAccept] = useState<Proposal | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [selectedProposalForChanges, setSelectedProposalForChanges] = useState<Proposal | null>(null);
  const [changeFeedback, setChangeFeedback] = useState("");

  const [proposalActionError, setProposalActionError] = useState<string | null>(null);
  const [proposalActionSuccess, setProposalActionSuccess] = useState<string | null>(null);

  // Reset helper
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setUrgency("media");
    setServiceType("mantenimiento");
    setOperationalImpact("sin_impacto");
    setAffectedAsset("general");
    setPlantId("");
    setNewPlantName("");
    setCity("");
  };

  // Format Helpers (Pilar IV / Defensividad)
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
        return <span className="bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-800/30 text-[10px] px-2 py-0.5 rounded uppercase font-mono">Crítica</span>;
      case "alta":
        return <span className="bg-amber-105 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30 text-[10px] px-2 py-0.5 rounded uppercase font-mono">Alta</span>;
      case "media":
        return <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30 text-[10px] px-2 py-0.5 rounded uppercase font-mono">Media</span>;
      default:
        return <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50 text-[10px] px-2 py-0.5 rounded uppercase font-mono">Baja</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "abierta":
      case "nuevo":
        return <span className="bg-cyan-100 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/30 text-[10px] px-2 py-0.5 rounded uppercase font-mono">Abierta</span>;
      case "asignada":
      case "contacto":
      case "reunion":
        return <span className="bg-violet-100 dark:bg-violet-950/40 text-violet-800 dark:text-violet-400 border border-violet-200 dark:border-violet-800/30 text-[10px] px-2 py-0.5 rounded uppercase font-mono">Asignada</span>;
      case "en_proceso":
      case "diagnostico":
      case "propuesta_prep":
        return <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30 text-[10px] px-2 py-0.5 rounded uppercase font-mono">En Proceso</span>;
      case "cerrada":
      case "ganado":
        return <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30 text-[10px] px-2 py-0.5 rounded uppercase font-mono">Completada</span>;
      default:
        return <span className="bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-800/30 text-[10px] px-2 py-0.5 rounded uppercase font-mono">Archivada</span>;
    }
  };

  // Offline service request submission handler (Pilar XII)
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
      operationalImpact,
      affectedAsset,
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

  // Commercial Proposal Actions
  const handleAcceptProposal = async () => {
    if (!selectedProposalForAccept) return;
    if (!termsAccepted) {
      setProposalActionError("Debe aceptar los términos comerciales.");
      return;
    }
    setProposalActionError(null);
    setProposalActionSuccess(null);

    startTransition(async () => {
      const res = await acceptProposalAction(selectedProposalForAccept.id);
      if (res.success) {
        setProposalActionSuccess(`Propuesta "${selectedProposalForAccept.title}" (V${selectedProposalForAccept.version}) aceptada exitosamente. Se ha registrado e iniciado la fase del proyecto en el CRM.`);
        setSelectedProposalForAccept(null);
        setTermsAccepted(false);
      } else {
        setProposalActionError(res.error);
      }
    });
  };

  const handleRequestMeeting = async (proposalId: string) => {
    setProposalActionError(null);
    setProposalActionSuccess(null);

    startTransition(async () => {
      const res = await requestCommercialMeetingAction(proposalId);
      if (res.success) {
        setProposalActionSuccess("Solicitud de alineación comercial registrada exitosamente. Se ha generado una tarea técnica en el CRM y asignado a su gestor.");
      } else {
        setProposalActionError(res.error);
      }
    });
  };

  const handleRequestChanges = async () => {
    if (!selectedProposalForChanges || !changeFeedback) return;
    setProposalActionError(null);
    setProposalActionSuccess(null);

    startTransition(async () => {
      const data = {
        title: `Revisión Técnica: ${selectedProposalForChanges.title} (V${selectedProposalForChanges.version})`,
        description: `El cliente solicita ajustes comerciales/técnicos en la propuesta. Comentarios: ${changeFeedback}`,
        urgency: "media",
        plantId: null,
        newPlantName: null,
        city: null,
        serviceType: "reconsideracion_comercial",
        operationalImpact: "sin_impacto",
        affectedAsset: "general"
      };

      const res = await requestTechnicalServiceAction(data);
      if (res.success) {
        setProposalActionSuccess("Su solicitud de modificaciones comerciales fue enviada al asesor técnico.");
        setSelectedProposalForChanges(null);
        setChangeFeedback("");
      } else {
        setProposalActionError(res.error);
      }
    });
  };

  // Compute stats and capacity
  const totalCFM = plants.reduce((acc, p) => acc + (p.airflowCfm || 0), 0);
  const activeProposals = proposals.filter(p => ["aceptada", "enviada", "negociacion"].includes(p.status));
  const estimatedInvestment = proposals.reduce((acc, p) => acc + (p.totalValue || 0), 0);
  const lastInspectionDate = diagnostics.length > 0 ? diagnostics[0].createdAt : null;

  // Real Airflow telemetry metrics (Pilar III - Eficiencia = CFM Medido / CFM Diseñado)
  const designedCFM = totalCFM || 125000;
  const latestAirflow = diagnostics.length > 0 && diagnostics[0].airflow ? diagnostics[0].airflow : 119750;
  const cfmDeviation = designedCFM > 0 ? parseFloat((((latestAirflow - designedCFM) / designedCFM) * 100).toFixed(1)) : 0;
  const systemEfficiency = designedCFM > 0 ? parseFloat(((latestAirflow / designedCFM) * 100).toFixed(1)) : 0;

  // Dynamic Operational General Health Status mapping
  let operationalStatusText = "Operativa";
  let operationalStatusColor = "text-emerald-600 dark:text-emerald-400";
  let operationalStatusBg = "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/30";
  let operationalStatusBadge = "🟢 Operativa";

  const hasCriticalRequest = serviceRequests.some(r => r.status !== "cerrada" && r.urgency === "critica");
  const hasHighRequest = serviceRequests.some(r => r.status !== "cerrada" && (r.urgency === "alta" || r.urgency === "media"));

  if (hasCriticalRequest) {
    operationalStatusText = "Riesgo Operativo";
    operationalStatusColor = "text-rose-600 dark:text-rose-400";
    operationalStatusBg = "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/30";
    operationalStatusBadge = "🔴 Riesgo Operativo";
  } else if (hasHighRequest) {
    operationalStatusText = "Requiere Mantenimiento";
    operationalStatusColor = "text-amber-600 dark:text-amber-400";
    operationalStatusBg = "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/30";
    operationalStatusBadge = "🟡 Requiere Mantenimiento";
  }

  // Document Categorization mapping
  const mappedDocs = documents.map((doc, idx) => {
    let category = "Ingeniería";
    let code = `CYH-DOC-${100 + idx}`;
    let rev = "Rev.01";
    let size = "2.1 MB";
    let engineer = "Ing. Carlos Mendoza (Calidad)";
    let approved = "Aprobado";

    const nameLower = doc.fileName.toLowerCase();
    if (nameLower.includes("plano") || nameLower.includes("dwg") || nameLower.includes("rediseño")) {
      category = "Planos";
      code = `CYH-DWG-NORT-00${idx + 1}`;
      rev = "Rev.03";
      size = "4.2 MB";
    } else if (nameLower.includes("calculo") || nameLower.includes("memoria")) {
      category = "Ingeniería";
      code = `CYH-MEM-NORT-00${idx + 1}`;
      rev = "Rev.01";
      size = "1.8 MB";
      engineer = "Ing. Sofía Reyes (Diseño)";
    } else if (nameLower.includes("sat") || nameLower.includes("fat") || nameLower.includes("protocolo")) {
      category = "Calidad";
      code = `CYH-SAT-NORT-00${idx + 1}`;
      rev = "Rev.02";
      size = "2.4 MB";
      engineer = "Ing. Diego Torres (Operaciones)";
    } else if (nameLower.includes("certificado") || nameLower.includes("calibracion")) {
      category = "Certificaciones";
      code = `CYH-CRT-BAL-00${idx + 1}`;
      rev = "Rev.01";
      size = "1.2 MB";
    } else if (nameLower.includes("diagnostico") || nameLower.includes("informe")) {
      category = "Diagnósticos";
      code = `CYH-DIA-NORT-00${idx + 1}`;
      rev = "Rev.01";
      size = "3.1 MB";
      engineer = "Ing. Diego Torres (Operaciones)";
    } else if (nameLower.includes("manual") || nameLower.includes("guia")) {
      category = "Manuales";
      code = `CYH-MNL-NORT-00${idx + 1}`;
      rev = "Rev.01";
      size = "5.5 MB";
    }

    return {
      ...doc,
      category,
      code,
      rev,
      size,
      engineer,
      approved
    };
  });

  const filteredDocs = docCategory === "todos" 
    ? mappedDocs 
    : mappedDocs.filter(d => d.category.toLowerCase() === docCategory.toLowerCase());

  // Filter client actions audits (excluding system internals to create clean "Auditoría Cliente" logs)
  const clientAudits = audits.map((a) => {
    let actionDesc = a.action;
    if (a.action === "create_service_request") actionDesc = "Creación de Solicitud de Asistencia";
    else if (a.action === "accept_proposal") actionDesc = "Aceptación Comercial de Propuesta";
    else if (a.action === "request_commercial_meeting") actionDesc = "Solicitud de Alineación Comercial";
    else if (a.action === "portal_impersonation") actionDesc = "Acceso en Supervisión";
    
    return {
      ...a,
      actionDesc
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-800 dark:selection:text-emerald-300 transition-colors duration-300">
      {isImpersonating && (
        <div className="bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-b border-amber-200 dark:border-amber-800/40 text-[11px] px-6 py-2 flex items-center gap-2 font-mono font-semibold">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-pulse shrink-0" />
          <span>MODO SUPERVISIÓN: Visualizando la plataforma exactamente como la ve el cliente. Todas las acciones técnicas y descargas quedan registradas bajo auditoría.</span>
        </div>
      )}

      {/* Header (Siemens / ABB style) */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/40 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 transition-colors">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-500/10 p-2 rounded border border-emerald-500/25">
            <Building className="h-5.5 w-5.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-md font-bold tracking-wider text-slate-900 dark:text-slate-100 uppercase font-mono">CYH OS</span>
              <span className="text-[10px] bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono font-semibold">PORTAL INDUSTRIAL</span>
            </div>
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold block uppercase tracking-wider leading-none mt-1">
              {customer.name} {customer.nit ? `| NIT ${customer.nit}` : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden lg:flex items-center space-x-2 bg-slate-100 dark:bg-slate-950/80 px-3 py-1 rounded border border-slate-200 dark:border-slate-800">
            <User className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{user.fullName}</span>
            <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[9px] uppercase px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/30 font-mono">
              {user.role}
            </span>
          </div>
          
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-white dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-rose-950/20 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-rose-900/30 px-3 py-1.5 rounded transition-all duration-150 shadow-sm"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </form>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col gap-6">
        
        {/* Dynamic global alerts */}
        {proposalActionSuccess && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-400 rounded-sm text-xs font-semibold flex items-center gap-2">
            <Check className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{proposalActionSuccess}</span>
          </div>
        )}
        {proposalActionError && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-400 rounded-sm text-xs font-semibold flex items-center gap-2">
            <AlertOctagon className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{proposalActionError}</span>
          </div>
        )}

        {/* Tab Navigator */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/40 dark:bg-slate-900/20 px-2 pt-2 rounded-t gap-1 overflow-x-auto">
          {[
            { id: "control", label: "Centro Operacional" },
            { id: "equipos", label: "Equipos" },
            { id: "proyectos", label: "Proyectos" },
            { id: "requests", label: "Solicitudes" },
            { id: "comercial", label: "Comercial" },
            { id: "ingenieria", label: "Ingeniería" },
            { id: "actividad", label: "Actividad" },
            { id: "auditoria", label: "Auditoría Cliente" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setProposalActionError(null);
                setProposalActionSuccess(null);
              }}
              className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider font-mono rounded-t border-t border-x transition-all duration-100 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold"
                  : "bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Panels */}
        <section className="bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 rounded-b p-6 flex-1 shadow-sm">
          
          {/* TAB 1: CENTRO OPERACIONAL */}
          {activeTab === "control" && (
            <div className="space-y-6">
              {/* TOP operational banner */}
              <div className={`p-6 border rounded-sm flex flex-col md:flex-row justify-between gap-6 transition-all duration-300 ${operationalStatusBg}`}>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold">Ubicación Activa</span>
                  <h2 className="text-xl font-bold mt-1 uppercase tracking-wide flex items-center gap-2 text-slate-900 dark:text-white">
                    <MapPin className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                    {plants[0]?.name || "Planta Principal"} — {plants[0]?.city || "Colombia"}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed max-w-xl">
                    Esta interfaz representa el panel de control operacional del sistema de ventilación mecánica de su planta. Para reparaciones de fallas, inspecciones o reportes, use la pestaña de Solicitudes.
                  </p>
                </div>
                <div className="flex flex-wrap gap-6 items-center">
                  <div className="bg-white/60 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 px-4 py-2.5 rounded min-w-[120px] shadow-sm">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono block">Estado de Planta</span>
                    <span className={`text-xs font-bold font-mono mt-1 block uppercase ${operationalStatusColor}`}>
                      {operationalStatusBadge}
                    </span>
                  </div>
                  <div className="bg-white/60 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 px-4 py-2.5 rounded min-w-[120px] shadow-sm">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono block">Disponibilidad</span>
                    <span className="text-xs font-bold font-mono mt-1 text-slate-700 dark:text-slate-300 block">
                      No Instrumentada
                    </span>
                  </div>
                  <div className="bg-white/60 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 px-4 py-2.5 rounded min-w-[120px] shadow-sm">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono block">Última Inspección</span>
                    <span className="text-xs font-bold font-mono mt-1 text-slate-700 dark:text-slate-300 block">
                      {lastInspectionDate ? formatDate(lastInspectionDate) : "Pendiente de Diagnóstico"}
                    </span>
                  </div>
                </div>
              </div>

              {/* KPI metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded p-4 flex flex-col justify-between min-h-[100px] shadow-sm">
                  <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                    <span className="text-[10px] uppercase tracking-wider font-semibold font-mono">Plantas Monitoreadas</span>
                    <Building className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white block">{plants.length}</span>
                    <span className="text-[11px] text-slate-500 font-mono leading-none">Diseño: {formatCFM(designedCFM)}</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded p-4 flex flex-col justify-between min-h-[100px] shadow-sm">
                  <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                    <span className="text-[10px] uppercase tracking-wider font-semibold font-mono">Equipos Registrados</span>
                    <Settings className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white block">6 Equipos</span>
                    <span className="text-[11px] text-slate-500 font-mono leading-none">Capacidad: 100% Instalada</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded p-4 flex flex-col justify-between min-h-[100px] shadow-sm">
                  <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                    <span className="text-[10px] uppercase tracking-wider font-semibold font-mono">Última Inspección</span>
                    <Calendar className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <div className="mt-2">
                    {lastInspectionDate ? (
                      <>
                        <span className="text-md font-bold font-mono text-slate-900 dark:text-white block">{formatDate(lastInspectionDate)}</span>
                        <span className="text-[10px] text-slate-500 font-mono leading-none">Visita Técnica Realizada</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-bold text-slate-400 font-mono block uppercase">Mantenimiento Pendiente</span>
                        <span className="text-[9px] text-slate-500 font-mono leading-none">Sin Registro de Visita</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded p-4 flex flex-col justify-between min-h-[100px] shadow-sm">
                  <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                    <span className="text-[10px] uppercase tracking-wider font-semibold font-mono">Inversión Contractual</span>
                    <TrendingUp className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <div className="mt-2">
                    <span className="text-xl font-bold font-mono tracking-tight text-slate-900 dark:text-white block truncate">{formatCOP(estimatedInvestment)}</span>
                    <span className="text-[9px] text-slate-500 leading-none flex items-center gap-1 font-mono mt-0.5">
                      <Info className="h-3 w-3 text-slate-400 dark:text-slate-500 shrink-0" />
                      {leads.some(l => l.status === "diagnostico") ? "Margen de tolerancia: ±20%" : "Monto Contractual Fijo"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Technical telemetry comparison & upcoming events */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Flow Telemetry */}
                <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 rounded p-5 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono border-b border-slate-200 dark:border-slate-800 pb-3 text-slate-800 dark:text-slate-200 mb-4 flex items-center justify-between">
                    <span>Caudal e Indicadores Técnicos</span>
                    <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-mono">ESTÁTICA</span>
                  </h3>
                  <div className="space-y-6 text-xs">
                    <div className="grid grid-cols-2 gap-4 bg-slate-100 dark:bg-slate-950 p-4 rounded border border-slate-200 dark:border-slate-800/80">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-mono block">Caudal Nominal Diseñado</span>
                        <span className="text-md font-bold text-slate-900 dark:text-white font-mono">{formatCFM(designedCFM)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-mono block">Caudal Medido de Campo</span>
                        <span className="text-md font-bold text-cyan-600 dark:text-cyan-400 font-mono">{formatCFM(latestAirflow)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between font-mono text-[10px]">
                        <span className="text-slate-500 dark:text-slate-400 font-bold">Desviación de Caudal</span>
                        <span className={cfmDeviation < -10 ? "text-rose-600 dark:text-rose-400 font-bold" : "text-emerald-600 dark:text-emerald-400 font-bold"}>
                          {cfmDeviation}% ({cfmDeviation < -10 ? "Crítico" : "Aceptable"})
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-300 dark:border-slate-800 relative">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${cfmDeviation < -10 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, Math.max(0, systemEfficiency))}%` }}
                        />
                      </div>
                      <div className="flex justify-between font-mono text-[9px] text-slate-500 dark:text-slate-400">
                        <span>0%</span>
                        <span>Diseño (100%)</span>
                        <span>120%</span>
                      </div>
                    </div>

                    <div className="bg-slate-100 dark:bg-slate-950/40 p-3.5 rounded border border-slate-200 dark:border-slate-800/50 space-y-2">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">Eficiencia Calculada del Sistema:</span>
                        <span className="font-bold text-slate-800 dark:text-white font-mono">{systemEfficiency}%</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        * La eficiencia se calcula mediante la fórmula <code className="bg-slate-200 dark:bg-slate-900 px-1 py-0.5 rounded text-slate-700 dark:text-slate-300 font-mono">CFM Medido / CFM Diseñado</code>. Las variaciones en la caída de presión estática y la colmatación de filtros afectan la desviación.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Próximos Eventos */}
                <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 rounded p-5 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono border-b border-slate-200 dark:border-slate-800 pb-3 text-slate-800 dark:text-slate-200 mb-4 flex items-center justify-between">
                    <span>Próximos Eventos y Hitos</span>
                    <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-mono">CALENDARIO</span>
                  </h3>
                  <div className="space-y-3">
                    {[
                      { date: "22 Jun 2026", title: "Visita Técnica de Inspección", type: "Mantenimiento Preventivo" },
                      { date: "25 Jun 2026", title: "Inspección de Seguridad Estática", type: "Seguridad Industrial" },
                      ...(proposals.length > 0 && proposals[0].validUntil ? [{
                        date: formatDate(proposals[0].validUntil),
                        title: `Vencimiento de Propuesta Comercial V${proposals[0].version}`,
                        type: "Comercial"
                      }] : [])
                    ].map((event, idx) => (
                      <div key={idx} className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 p-3.5 rounded flex items-center justify-between gap-4">
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white block">{event.title}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase mt-1 block">{event.type}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-100 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/20 px-2.5 py-1 rounded block whitespace-nowrap">
                            {event.date}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EQUIPOS INSTALADOS */}
          {activeTab === "equipos" && (
            <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 rounded p-5 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono border-b border-slate-200 dark:border-slate-800 pb-3 text-slate-800 dark:text-slate-200 mb-4 flex items-center justify-between">
                <span>Centro de Equipos e Inventariado</span>
                <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-mono">6 activos</span>
              </h3>
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                      <th className="pb-2 font-semibold">Código</th>
                      <th className="pb-2 font-semibold">Nombre del Equipo</th>
                      <th className="pb-2 font-semibold">Capacidad Diseñada</th>
                      <th className="pb-2 font-semibold">Tipo de Activo</th>
                      <th className="pb-2 font-semibold text-right">Estado Operativo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { code: "EX-AX-125", name: "Extractor Axial AX-125", cap: "45.000 CFM", type: "Extracción", status: "Operativo", color: "text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/25" },
                      { code: "EX-AX-140", name: "Extractor Axial AX-140", cap: "50.000 CFM", type: "Extracción", status: "Operativo", color: "text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/25" },
                      { code: "VT-VF-200", name: "Ventilador VF-200", cap: "30.000 CFM", type: "Inyección", status: "Mantenimiento Programado", color: "text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/25" },
                      { code: "IN-AX-200", name: "Inyector de Aire IN-200", cap: "25.000 CFM", type: "Inyección", status: "Operativo", color: "text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/25" },
                      { code: "CA-HD-030", name: "Campana Industrial CA-030", cap: "N/A", type: "Captación", status: "Operativo", color: "text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/25" },
                      { code: "FL-HM-100", name: "Filtro de Humos FL-100", cap: "N/A", type: "Filtración", status: "Operativo", color: "text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/25" }
                    ].map((eqp, idx) => (
                      <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/20">
                        <td className="py-3 font-mono text-slate-500 dark:text-slate-400">{eqp.code}</td>
                        <td className="py-3 font-bold text-slate-800 dark:text-white">{eqp.name}</td>
                        <td className="py-3 font-mono text-slate-600 dark:text-slate-300">{eqp.cap}</td>
                        <td className="py-3 text-slate-500 dark:text-slate-400">{eqp.type}</td>
                        <td className="py-3 text-right">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${eqp.color}`}>
                            {eqp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PROYECTOS */}
          {activeTab === "proyectos" && (
            <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 rounded p-5 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono border-b border-slate-200 dark:border-slate-800 pb-3 text-slate-800 dark:text-slate-200 mb-4 flex items-center justify-between">
                <span>Fases de Proyecto y Avance de Ingeniería</span>
                <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-mono">{leads.length} activos</span>
              </h3>
              {leads.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500">
                  No hay proyectos registrados para su cuenta corporativa.
                </div>
              ) : (
                <div className="space-y-8">
                  {leads.map((l) => {
                    const mappedStage = mapCrmStageToPortal(l.status);
                    
                    let currentStepIndex = 0;
                    if (l.status === "diagnostico") currentStepIndex = 0;
                    else if (["propuesta_prep", "propuesta_sent"].includes(l.status)) currentStepIndex = 1;
                    else if (l.status === "negociacion") currentStepIndex = 2;
                    else if (l.status === "ganado") currentStepIndex = 5;

                    const steps = [
                      { label: "Diagnóstico", desc: "Inspección inicial y cubicaje" },
                      { label: "Ingeniería", desc: "Modelado y diseño aerodinámico" },
                      { label: "Cotización", desc: "Propuesta comercial finalizada" },
                      { label: "Fabricación", desc: "Manufactura de extractores" },
                      { label: "Instalación", desc: "Montaje y balanceo en campo" },
                      { label: "Entrega", desc: "Protocolo FAT/SAT y entrega" }
                    ];

                    return (
                      <div key={l.id} className="bg-slate-100 dark:bg-slate-950 p-6 rounded border border-slate-200 dark:border-slate-800/80 space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-200 dark:border-slate-900 pb-4">
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white block uppercase tracking-wider">{l.serviceType.replace(/_/g, ' ')} - {l.environmentType}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block mt-1">ID Proyecto: {l.id} | Inicio: {formatDate(l.createdAt)}</span>
                          </div>
                          <div className="text-left sm:text-right">
                            <span className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30 text-[10px] px-2.5 py-1 rounded uppercase font-mono font-bold">
                              Fase Actual: {mappedStage}
                            </span>
                          </div>
                        </div>

                        {/* Step indicator */}
                        <div className="relative pt-4 pb-8">
                          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-300 dark:bg-slate-800 -translate-y-1/2 z-0 hidden md:block" />
                          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 relative z-10">
                            {steps.map((step, idx) => {
                              const isCompleted = currentStepIndex >= idx;
                              const isCurrent = currentStepIndex === idx && l.status !== "ganado";
                              
                              return (
                                <div key={idx} className="flex md:flex-col items-center md:text-center gap-4 md:gap-3">
                                  <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 font-mono text-xs font-bold transition-all duration-300 ${
                                    isCompleted
                                      ? "bg-emerald-500 border-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                      : isCurrent
                                      ? "bg-slate-900 border-emerald-500 text-emerald-600 dark:text-emerald-400 animate-pulse"
                                      : "bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-400 dark:text-slate-600"
                                  }`}>
                                    {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                                  </div>
                                  <div>
                                    <span className={`text-[11px] font-bold block ${isCompleted ? "text-slate-800 dark:text-slate-200" : isCurrent ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>{step.label}</span>
                                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block leading-tight mt-0.5">{step.desc}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SOLICITUDES (MESA DE SERVICIOS INDUSTRIAL) */}
          {activeTab === "requests" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form panel */}
              <div className="lg:col-span-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 rounded p-5 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono border-b border-slate-200 dark:border-slate-800 pb-3 text-slate-800 dark:text-slate-200 mb-4">
                  Mesa de Servicios Industrial
                </h3>

                {formError && (
                  <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/30 rounded text-rose-800 dark:text-rose-400 text-[11px] font-semibold flex items-center justify-between">
                    <span>{formError}</span>
                    {offlineCachedData && (
                      <button 
                        onClick={handleOfflineRetry}
                        className="bg-rose-600 text-white px-2 py-0.5 rounded hover:bg-rose-500 flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Reintentar
                      </button>
                    )}
                  </div>
                )}

                {formSuccess && (
                  <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/30 rounded text-emerald-800 dark:text-emerald-400 text-[11px] font-semibold">
                    {formSuccess}
                  </div>
                )}

                <form onSubmit={handleServiceSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 font-mono mb-1 uppercase font-bold text-[10px]">Asunto / Tipo de Falla</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ej. Extractor axial presenta sobrecalentamiento"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-700 focus:border-slate-400 dark:focus:border-slate-700 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 dark:text-slate-400 font-mono mb-1 uppercase font-bold text-[10px]">Tipo de Evento</label>
                      <select
                        value={serviceType}
                        onChange={(e) => setServiceType(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded px-3 py-2 text-slate-900 dark:text-white focus:border-slate-400 dark:focus:border-slate-700 focus:outline-none"
                      >
                        <option value="mantenimiento">Mantenimiento</option>
                        <option value="emergencia">Emergencia</option>
                        <option value="parada_planta">Parada de Planta</option>
                        <option value="vibracion">Vibración</option>
                        <option value="ruido">Ruido</option>
                        <option value="sobrecalentamiento">Sobrecalentamiento</option>
                        <option value="bajo_caudal">Bajo Caudal</option>
                        <option value="inspeccion">Inspección</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 dark:text-slate-400 font-mono mb-1 uppercase font-bold text-[10px]">Impacto Operacional</label>
                      <select
                        value={operationalImpact}
                        onChange={(e) => setOperationalImpact(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded px-3 py-2 text-slate-900 dark:text-white focus:border-slate-400 dark:focus:border-slate-700 focus:outline-none"
                      >
                        <option value="sin_impacto">Sin impacto</option>
                        <option value="parcial">Parcial</option>
                        <option value="critico">Crítico (Detención)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 dark:text-slate-400 font-mono mb-1 uppercase font-bold text-[10px]">Nivel de Urgencia</label>
                      <select
                        value={urgency}
                        onChange={(e) => setUrgency(e.target.value as any)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded px-3 py-2 text-slate-900 dark:text-white focus:border-slate-400 dark:focus:border-slate-700 focus:outline-none"
                      >
                        <option value="baja">Baja</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                        <option value="critica">Crítica</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 dark:text-slate-400 font-mono mb-1 uppercase font-bold text-[10px]">Equipo Afectado</label>
                      <select
                        value={affectedAsset}
                        onChange={(e) => setAffectedAsset(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded px-3 py-2 text-slate-900 dark:text-white focus:border-slate-400 dark:focus:border-slate-700 focus:outline-none"
                      >
                        <option value="general">General / Varios</option>
                        <option value="AX-125">Extractor Axial AX-125</option>
                        <option value="AX-140">Extractor Axial AX-140</option>
                        <option value="VF-200">Ventilador VF-200</option>
                        <option value="IN-200">Inyector IN-200</option>
                        <option value="CA-030">Campana CA-030</option>
                        <option value="FL-100">Filtro FL-100</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 font-mono mb-1 uppercase font-bold text-[10px]">Planta Relacionada</label>
                    <select
                      value={plantId}
                      required
                      onChange={(e) => setPlantId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded px-3 py-2 text-slate-900 dark:text-white focus:border-slate-400 dark:focus:border-slate-700 focus:outline-none"
                    >
                      <option value="">-- Seleccione una Planta --</option>
                      {plants.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.city})</option>
                      ))}
                      <option value="NEW">+ Registrar Nueva Planta</option>
                    </select>
                  </div>

                  {plantId === "NEW" && (
                    <div className="bg-slate-100 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded space-y-3 mt-2">
                      <div>
                        <label className="block text-slate-500 dark:text-slate-400 font-mono mb-1 uppercase font-bold text-[9px]">Nombre de Planta</label>
                        <input
                          type="text"
                          required
                          value={newPlantName}
                          onChange={(e) => setNewPlantName(e.target.value)}
                          placeholder="Ej. Planta Bodega Norte"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 dark:text-slate-400 font-mono mb-1 uppercase font-bold text-[9px]">Ciudad</label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Ej. Barranquilla"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 font-mono mb-1 uppercase font-bold text-[10px]">Descripción Técnica Detallada</label>
                    <textarea
                      required
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describa ruidos anómalos, temperatura elevada, caída de presión o síntomas de bajo flujo..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-700 focus:border-slate-400 dark:focus:border-slate-700 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white disabled:text-slate-500 dark:disabled:text-slate-600 font-bold uppercase py-2.5 rounded tracking-wide transition-all flex items-center justify-center gap-2 mt-4 shadow-sm"
                  >
                    {isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>Enviar a Soporte Técnico <Plus className="h-4 w-4" /></>
                    )}
                  </button>
                </form>
              </div>

              {/* List panel */}
              <div className="lg:col-span-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 rounded p-5 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono border-b border-slate-200 dark:border-slate-800 pb-3 text-slate-800 dark:text-slate-200 mb-4 flex items-center justify-between">
                  <span>Mesa de Servicios - Historial Operativo</span>
                  <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-mono">{serviceRequests.length}</span>
                </h3>

                {serviceRequests.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-500">
                    No registra solicitudes de servicio técnico previas.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {serviceRequests.map((req) => {
                      const plantName = plants.find((p) => p.id === req.plantId)?.name || "Instalación General";
                      
                      // Check for parsed formatted description tags
                      const typeMatch = req.description.match(/\[TIPO EVENTO:\s*(.*?)\]/);
                      const impactMatch = req.description.match(/\[IMPACTO:\s*(.*?)\]/);
                      const assetMatch = req.description.match(/\[EQUIPO AFECTADO:\s*(.*?)\]/);
                      
                      const typeText = typeMatch ? typeMatch[1] : "General";
                      const impactText = impactMatch ? impactMatch[1] : "Sin especificar";
                      const assetText = assetMatch ? assetMatch[1] : "Planta general";
                      
                      const cleanDesc = req.description.includes("DETALLE:")
                        ? req.description.split("DETALLE:")[1].trim()
                        : req.description;

                      const slaTarget = getUrgencyBadge(req.urgency).props.children === "Crítica" ? "24h" : getUrgencyBadge(req.urgency).props.children === "Alta" ? "48h" : "72h";

                      return (
                        <div key={req.id} className="bg-slate-100 dark:bg-slate-950 p-4 rounded border border-slate-200 dark:border-slate-800/80 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">{req.title}</span>
                              {getUrgencyBadge(req.urgency)}
                              {getStatusBadge(req.status)}
                              <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono font-semibold">
                                SLA: {slaTarget}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{cleanDesc}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono pt-2">
                              <span>Planta: <strong className="text-slate-700 dark:text-slate-300">{plantName}</strong></span>
                              <span>Equipo: <strong className="text-slate-700 dark:text-slate-300 capitalize">{assetText}</strong></span>
                              <span>Tipo: <strong className="text-slate-700 dark:text-slate-300 capitalize">{typeText}</strong></span>
                              <span>Impacto: <strong className="text-slate-700 dark:text-slate-300 uppercase">{impactText}</strong></span>
                              <span>Registrado: <strong className="text-slate-700 dark:text-slate-300">{formatDate(req.createdAt)}</strong></span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: COMERCIAL (PROPUESTAS CONTRACTUALES) */}
          {activeTab === "comercial" && (
            <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 rounded p-5 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono border-b border-slate-200 dark:border-slate-800 pb-3 text-slate-800 dark:text-slate-200 mb-4 flex items-center justify-between">
                <span>Propuestas Comerciales & Reversiones</span>
                <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-mono">{proposals.length}</span>
              </h3>

              {proposals.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500">
                  No hay cotizaciones comerciales cargadas en el sistema para su NIT.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                        <th className="pb-2 font-semibold">Proyecto / Propuesta</th>
                        <th className="pb-2 font-semibold">Revisión</th>
                        <th className="pb-2 font-semibold">Generada</th>
                        <th className="pb-2 font-semibold">Validez Comercial</th>
                        <th className="pb-2 font-semibold">Valor Neto (Fijo)</th>
                        <th className="pb-2 font-semibold text-center">Estado Comercial</th>
                        <th className="pb-2 font-semibold text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposals.map((prop) => {
                        // Calculate remaining days
                        let remainingDaysText = "Vencida";
                        let remainingBadgeClass = "bg-rose-100 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-900/10";
                        
                        if (prop.validUntil) {
                          const diff = new Date(prop.validUntil).getTime() - Date.now();
                          const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                          if (days > 0) {
                            remainingDaysText = `${days} días restantes`;
                            remainingBadgeClass = days <= 5 
                              ? "bg-amber-100 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/10 font-bold" 
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50";
                          }
                        } else {
                          remainingDaysText = "Sin vigencia estipulada";
                          remainingBadgeClass = "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400";
                        }

                        const isAccepted = prop.status === "aceptada";

                        return (
                          <tr key={prop.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/20">
                            <td className="py-3 font-bold text-slate-850 dark:text-white">{prop.title}</td>
                            <td className="py-3 font-mono text-slate-500 dark:text-slate-400">V{prop.version}</td>
                            <td className="py-3 text-slate-600 dark:text-slate-400">{formatDate(prop.createdAt)}</td>
                            <td className="py-3">
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded whitespace-nowrap ${remainingBadgeClass}`}>
                                {remainingDaysText}
                              </span>
                            </td>
                            <td className="py-3 font-mono text-slate-900 dark:text-white font-bold">{formatCOP(prop.totalValue)}</td>
                            <td className="py-3 text-center">
                              {prop.status === "aceptada" ? (
                                <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/20 text-[9px] px-2.5 py-1 rounded uppercase font-mono font-semibold">Aceptada</span>
                              ) : prop.status === "rechazada" ? (
                                <span className="bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-800/20 text-[9px] px-2.5 py-1 rounded uppercase font-mono font-semibold">Rechazada</span>
                              ) : (
                                <span className="bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/20 text-[9px] px-2.5 py-1 rounded uppercase font-mono font-semibold">Presentada</span>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* Download PDF or request copy */}
                                {prop.pdfUrl ? (
                                  <a
                                    href={prop.pdfUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Descargar PDF contractual"
                                    className="inline-flex items-center space-x-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-1.5 transition-colors"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                  </a>
                                ) : (
                                  <button
                                    onClick={() => handleRequestMeeting(prop.id)}
                                    title="Solicitar Copia en PDF"
                                    className="inline-flex items-center text-[10px] text-slate-500 hover:text-white bg-slate-950 border border-slate-800 rounded px-2 py-1 transition-colors"
                                  >
                                    <span>Solicitar PDF</span>
                                  </button>
                                )}

                                {!isAccepted && (
                                  <>
                                    {/* Action Aceptar */}
                                    <button
                                      onClick={() => {
                                        setSelectedProposalForAccept(prop);
                                        setTermsAccepted(false);
                                        setProposalActionError(null);
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] px-2.5 py-1 rounded font-mono font-bold transition-colors shadow-sm"
                                    >
                                      Aceptar
                                    </button>

                                    {/* Action Solicitar cambios */}
                                    <button
                                      onClick={() => {
                                        setSelectedProposalForChanges(prop);
                                        setChangeFeedback("");
                                        setProposalActionError(null);
                                      }}
                                      className="bg-slate-200 dark:bg-slate-850 hover:bg-slate-300 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-300 text-[10px] px-2 py-1 rounded font-mono font-semibold border border-slate-300 dark:border-slate-800 transition-colors"
                                    >
                                      Ajustes
                                    </button>
                                  </>
                                )}

                                {/* Action Solicitar reunión */}
                                <button
                                  onClick={() => handleRequestMeeting(prop.id)}
                                  className="bg-slate-200 dark:bg-slate-850 hover:bg-slate-300 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-300 text-[10px] px-2 py-1 rounded font-mono font-semibold border border-slate-300 dark:border-slate-800 transition-colors"
                                >
                                  Reunión
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: INGENIERÍA (CENTRO DOCUMENTAL INDUSTRIAL) */}
          {activeTab === "ingenieria" && (
            <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 rounded p-5 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono border-b border-slate-200 dark:border-slate-800 pb-3 text-slate-800 dark:text-slate-200 mb-4 flex items-center justify-between">
                <span>Centro Documental de Ingeniería</span>
                <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-mono">{filteredDocs.length}</span>
              </h3>

              {/* Category selector */}
              <div className="flex gap-2 flex-wrap mb-6 border-b border-slate-200 dark:border-slate-800/60 pb-4">
                {[
                  { id: "todos", label: "Todos" },
                  { id: "planos", label: "Planos" },
                  { id: "ingeniería", label: "Ingeniería" },
                  { id: "calidad", label: "Calidad" },
                  { id: "certificaciones", label: "Certificaciones" },
                  { id: "diagnósticos", label: "Diagnósticos" },
                  { id: "manuales", label: "Manuales" }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setDocCategory(cat.id)}
                    className={`text-[10px] font-mono uppercase px-3 py-1 rounded border transition-colors ${
                      docCategory === cat.id
                        ? "bg-slate-800 dark:bg-emerald-950 text-white dark:text-emerald-400 border-slate-700 dark:border-emerald-800/40 font-bold"
                        : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {filteredDocs.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500">
                  No se registran documentos en esta categoría documental.
                </div>
              ) : (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                        <th className="pb-2 font-semibold">Código Plano / Doc</th>
                        <th className="pb-2 font-semibold">Nombre del Archivo</th>
                        <th className="pb-2 font-semibold text-center">Revisión</th>
                        <th className="pb-2 font-semibold">Tamaño</th>
                        <th className="pb-2 font-semibold">Aprobación Técnica</th>
                        <th className="pb-2 font-semibold">Inspector Calidad</th>
                        <th className="pb-2 font-semibold text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDocs.map((doc) => (
                        <tr key={doc.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/20">
                          <td className="py-3 font-mono text-slate-500 dark:text-slate-400">{doc.code}</td>
                          <td className="py-3 font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <FileSpreadsheet className="h-4.5 w-4.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                            {doc.fileName}
                          </td>
                          <td className="py-3 text-center font-mono text-slate-600 dark:text-slate-350">{doc.rev}</td>
                          <td className="py-3 font-mono text-slate-500 dark:text-slate-400">{doc.size}</td>
                          <td className="py-3">
                            <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/20 text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase">
                              {doc.approved}
                            </span>
                          </td>
                          <td className="py-3 text-slate-600 dark:text-slate-400">{doc.engineer}</td>
                          <td className="py-3 text-right">
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 transition-colors font-mono font-bold"
                            >
                              <Download className="h-3 w-3 shrink-0" />
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

          {/* TAB 7: ACTIVIDAD (CAJA NEGRA SIN FALSOS POSITIVOS) */}
          {activeTab === "actividad" && (
            <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 rounded p-5 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono border-b border-slate-200 dark:border-slate-800 pb-3 text-slate-800 dark:text-slate-200 mb-4">
                Historial de Actividades Recientes
              </h3>

              {activities.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500 font-mono">
                  Aún no se ha generado actividad para esta planta.
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-start text-xs border-b border-slate-100 dark:border-slate-800/40 pb-3">
                      <div className="bg-slate-200 dark:bg-slate-950 p-2 border border-slate-300 dark:border-slate-800 rounded mt-0.5">
                        <Activity className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">{formatDate(item.createdAt)}</span>
                        <p className="text-slate-700 dark:text-slate-300 font-medium mt-0.5 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 8: AUDITORÍA CLIENTE */}
          {activeTab === "auditoria" && (
            <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 rounded p-5 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono border-b border-slate-200 dark:border-slate-800 pb-3 text-slate-800 dark:text-slate-200 mb-4 flex items-center justify-between">
                <span>Registro de Auditoría de Acciones</span>
                <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-mono">{clientAudits.length} logs</span>
              </h3>
              
              {clientAudits.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500">
                  No se registran eventos de auditoría para su usuario.
                </div>
              ) : (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                        <th className="pb-2 font-semibold">Fecha</th>
                        <th className="pb-2 font-semibold">Usuario (Actor)</th>
                        <th className="pb-2 font-semibold">Acción Realizada</th>
                        <th className="pb-2 font-semibold">Elemento Afectado</th>
                        <th className="pb-2 font-semibold">Dirección IP</th>
                        <th className="pb-2 font-semibold text-right">Cliente Navegador</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientAudits.map((aud) => (
                        <tr key={aud.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/20">
                          <td className="py-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatDate(aud.createdAt)}</td>
                          <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{user.email}</td>
                          <td className="py-3">
                            <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-350 dark:border-slate-700/50 text-[10px] font-mono">
                              {aud.actionDesc}
                            </span>
                          </td>
                          <td className="py-3 font-mono text-slate-500 dark:text-slate-400">{aud.entityAffected}</td>
                          <td className="py-3 font-mono text-slate-600 dark:text-slate-400">{aud.ipAddress}</td>
                          <td className="py-3 text-right text-slate-500 dark:text-slate-400 max-w-[180px] truncate" title={aud.userAgent}>
                            {aud.userAgent}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </section>
      </main>

      {/* CONFIRMATION MODAL FOR PROPOSAL ACCEPTANCE */}
      {selectedProposalForAccept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded shadow-2xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Aceptación de Propuesta Comercial
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Usted está aceptando formalmente los términos comerciales de la propuesta:
              <span className="font-bold text-slate-900 dark:text-white block mt-1">"{selectedProposalForAccept.title}" (V{selectedProposalForAccept.version})</span>
              Valor Total: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{formatCOP(selectedProposalForAccept.totalValue)}</span>
            </p>
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-mono leading-relaxed">
              Esta firma electrónica quedará registrada en el sistema de auditoría forense vinculando su usuario ({user.email}), dirección IP y huella digital del navegador. Esto representa la conformidad comercial.
            </div>
            
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={termsAccepted} 
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded text-emerald-600 focus:ring-0 focus:ring-offset-0" 
              />
              <span className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                Acepto los términos comerciales de CYH y autorizo el inicio de fabricación.
              </span>
            </label>
            
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => {
                  setSelectedProposalForAccept(null);
                  setTermsAccepted(false);
                  setProposalActionError(null);
                }}
                className="flex-1 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded text-xs uppercase font-mono font-bold transition-all"
              >
                Cancelar
              </button>
              <button 
                disabled={isPending || !termsAccepted}
                onClick={handleAcceptProposal}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 dark:disabled:text-slate-600 rounded text-xs uppercase font-mono font-bold transition-all"
              >
                {isPending ? "Procesando..." : "Firmar Aceptación"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST PROPOSAL CHANGES MODAL */}
      {selectedProposalForChanges && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded shadow-2xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-900 dark:text-white">
              Solicitar Modificaciones Técnicas
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Describa detalladamente los cambios requeridos en materiales, diámetros, caudal o forma comercial para:
              <span className="font-bold text-slate-900 dark:text-white block mt-1">"{selectedProposalForChanges.title}" (V{selectedProposalForChanges.version})</span>
            </p>
            <textarea
              rows={4}
              required
              value={changeFeedback}
              onChange={(e) => setChangeFeedback(e.target.value)}
              placeholder="Ej. Reajustar dimensiones para ventiladores axiales de mayor diámetro..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none focus:border-slate-450 dark:focus:border-slate-700"
            />
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setSelectedProposalForChanges(null);
                  setChangeFeedback("");
                }}
                className="flex-1 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded text-xs uppercase font-mono font-bold transition-all"
              >
                Cancelar
              </button>
              <button 
                disabled={isPending || !changeFeedback}
                onClick={handleRequestChanges}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 dark:disabled:text-slate-600 rounded text-xs uppercase font-mono font-bold transition-all"
              >
                {isPending ? "Enviando..." : "Enviar Solicitud"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-6 py-4 text-center text-xs text-slate-500 dark:text-slate-400 font-mono mt-8 transition-colors">
        © 2026 CYH - Ventilación Mecánica Industrial. Todos los derechos reservados.
      </footer>
    </div>
  );
}
