"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { 
  Target,
  DollarSign,
  Clock,
  Search,
  Filter,
  FolderKanban,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  AlertCircle,
  Loader2,
  Calendar,
  MapPin,
  Building2,
  User,
  Shield,
  RefreshCw,
  LayoutDashboard,
  Rows,
  Wrench,
  Wind,
  X,
  Printer,
  Share2,
  Phone,
  MessageSquare,
  ExternalLink,
  FileText,
  AlertTriangle,
  Plus
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { leads, crmUsers } from "@/lib/db/schema";
import { getLeadByIdAction } from "@/lib/server-actions/leads";
import { 
  updateCommercialDataAction, 
  updateLeadStatusAction, 
  createActivityLogAction,
  updateLeadRiskLevelAction,
  createTaskAction
} from "@/lib/server-actions/crm";

type Lead = typeof leads.$inferSelect;
type CrmUser = typeof crmUsers.$inferSelect;

type CombinedLead = Lead & {
  assignedTo?: string | null;
  stage?: string | null;
  probability?: number | null;
  pipelineId?: string | null;
  airflow?: number | null;
};

const STAGES = [
  { id: "nuevo", name: "Nuevo Lead", bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", prob: 10 },
  { id: "contacto", name: "Contacto Inicial", bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-750", prob: 20 },
  { id: "reunion", name: "Mesa Reunión", bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-800", prob: 30 },
  { id: "diagnostico", name: "Diagnóstico Técnico", bg: "bg-blue-50/50", border: "border-blue-200", text: "text-blue-800", prob: 40 },
  { id: "propuesta_prep", name: "Propuesta Prep", bg: "bg-amber-50/40", border: "border-amber-200", text: "text-amber-700", prob: 50 },
  { id: "propuesta_entregada", name: "Propuesta Enviada", bg: "bg-amber-50/70", border: "border-amber-200", text: "text-amber-800", prob: 70 },
  { id: "negociacion", name: "Negociación", bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-900", prob: 80 },
  { id: "ganado", name: "Ganado (Cierre)", bg: "bg-emerald-50", border: "border-emerald-250", text: "text-emerald-800", prob: 100 },
  { id: "perdido", name: "Perdido", bg: "bg-red-50", border: "border-red-200", text: "text-red-800", prob: 0 },
];

const COLOMBIAN_INDUSTRIAL_CITIES = [
  "Barranquilla",
  "Bogotá",
  "Medellín",
  "Cali",
  "Cartagena",
  "Montería"
];

const renderCity = (city: string | null) => {
  if (!city) {
    return (
      <span className="inline-block text-[8px] px-1.5 py-0.5 rounded bg-amber-50 border border-amber-250 text-amber-800 font-bold uppercase select-none font-sans">
        [Ciudad por Confirmar]
      </span>
    );
  }
  if (!COLOMBIAN_INDUSTRIAL_CITIES.includes(city)) {
    return (
      <span className="inline-block text-[8px] px-1.5 py-0.5 rounded bg-amber-50 border border-amber-250 text-amber-800 font-bold uppercase select-none font-sans" title={city}>
        [Ciudad por Confirmar]
      </span>
    );
  }
  return city;
};

const renderAirflow = (airflow: number | null | undefined) => {
  if (airflow === null || airflow === undefined) {
    return (
      <span className="inline-block text-[8px] px-1.5 py-0.5 rounded bg-amber-50 border border-amber-250 text-amber-800 font-bold uppercase select-none font-sans">
        [Telemetría Pendiente]
      </span>
    );
  }
  return `${airflow.toLocaleString()} CFM`;
};

export default function PipelineClient({
  initialLeads = [],
  allCrmUsers = [],
  currentUser,
  initialView = "kanban"
}: {
  initialLeads: CombinedLead[];
  allCrmUsers: CrmUser[];
  currentUser: { id: string; name: string; role: string; email: string };
  initialView?: "kanban" | "list";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Local state for leads list to handle optimistic updates
  const [localLeads, setLocalLeads] = useState<CombinedLead[]>(initialLeads);
  const [draggedOverStage, setDraggedOverStage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterService, setFilterService] = useState("all");

  // Derive viewMode directly from URL query parameters (Next.js useSearchParams)
  const viewParam = searchParams ? searchParams.get("view") : null;
  const viewMode = viewParam === "list" ? "list" : "kanban";

  // Selected Lead Drawer state
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("resumen");
  const [fullLead, setFullLead] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Drawer Action States
  const [isActivityModalOpen, setActivityModalOpen] = useState(false);
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [activityTypeInput, setActivityTypeInput] = useState("call");
  const [activityDescription, setActivityDescription] = useState("");
  const [taskTypeInput, setTaskTypeInput] = useState("llamada");
  const [taskDueDateInput, setTaskDueDateInput] = useState("");
  const [taskDueTimeInput, setTaskDueTimeInput] = useState("");
  const [taskNotesInput, setTaskNotesInput] = useState("");
  const [savingDrawerAction, setSavingDrawerAction] = useState(false);
  const [actionError, setActionError] = useState("");

  // Sync state if initialLeads updates (cascade reload)
  useEffect(() => {
    setLocalLeads(initialLeads);
  }, [initialLeads]);

  // Load Lead details when selectedLeadId changes
  useEffect(() => {
    if (!selectedLeadId) {
      setFullLead(null);
      return;
    }
    const loadDetails = async () => {
      setLoadingDetails(true);
      try {
        const res = await getLeadByIdAction(selectedLeadId);
        if (res.success) {
          setFullLead(res.data);
        } else {
          showToast(res.error, "error");
        }
      } catch (err) {
        console.error("Error loading lead details:", err);
      } finally {
        setLoadingDetails(false);
      }
    };
    loadDetails();
  }, [selectedLeadId]);

  const selectedLead = localLeads.find(l => l.id === selectedLeadId);

  // Custom Toast state
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success"
  });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const handleViewChange = (mode: "kanban" | "list") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", mode);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    // Only allow drag if initiated from the drag handle marked with data-drag-handle
    const target = e.target as HTMLElement;
    const isHandle = target.closest("[data-drag-handle]");
    if (!isHandle) {
      e.preventDefault();
      return;
    }
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

    const leadToMove = localLeads.find(l => l.id === leadId);
    if (!leadToMove) return;

    // Failsafe: if dropping in same stage, ignore
    if (leadToMove.status === targetStage) return;

    // Optimistic Update
    const previousLeads = [...localLeads];
    const updatedLeads = localLeads.map(l => 
      l.id === leadId ? { ...l, status: targetStage, updatedAt: new Date() } : l
    );
    setLocalLeads(updatedLeads);
    setIsPending(true);

    try {
      const res = await updateLeadStatusAction(leadId, targetStage);
      if (res.success) {
        showToast("Etapa de oportunidad comercial actualizada.");
        router.refresh();
      } else {
        throw new Error(res.error || "Permisos insuficientes.");
      }
    } catch (err: any) {
      console.error("Dnd stage update failed:", err);
      // ROLLBACK on failure (failsafe snapback)
      setLocalLeads(previousLeads);
      showToast(err.message || "No se pudo actualizar el lead. Permisos insuficientes.", "error");
    } finally {
      setIsPending(false);
    }
  };

  // Click & Drag Separation using Ref Mouse coordinates
  const mouseStartRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseStartRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
  };

  const handleMouseUp = (e: React.MouseEvent, leadId: string) => {
    const diffX = Math.abs(e.clientX - mouseStartRef.current.x);
    const diffY = Math.abs(e.clientY - mouseStartRef.current.y);
    if (diffX > 5 || diffY > 5) {
      isDraggingRef.current = true;
    }
    if (!isDraggingRef.current) {
      setSelectedLeadId(leadId);
      setActionError("");
    }
  };

  // Drawer action handlers
  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setSavingDrawerAction(true);
    setActionError("");
    try {
      const res = await createActivityLogAction({
        leadId: selectedLead.id,
        activityType: activityTypeInput,
        description: activityDescription,
      });
      if (res.success) {
        showToast("Actividad comercial registrada.");
        setActivityModalOpen(false);
        setActivityDescription("");
        // Refresh details
        const detailsRes = await getLeadByIdAction(selectedLead.id);
        if (detailsRes.success) setFullLead(detailsRes.data);
        router.refresh();
      } else {
        setActionError(res.error || "Error al registrar actividad.");
      }
    } catch (err: any) {
      setActionError(err.message || "Error al procesar la solicitud.");
    } finally {
      setSavingDrawerAction(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setSavingDrawerAction(true);
    setActionError("");
    const combinedDateTime = `${taskDueDateInput}T${taskDueTimeInput || "09:00"}:00`;
    try {
      const res = await createTaskAction({
        leadId: selectedLead.id,
        taskType: taskTypeInput,
        dueDate: combinedDateTime,
        notes: taskNotesInput,
        assignedTo: selectedLead.assignedTo || currentUser.email,
      });
      if (res.success) {
        showToast("Tarea comercial programada.");
        setTaskModalOpen(false);
        setTaskNotesInput("");
        setTaskDueDateInput("");
        setTaskDueTimeInput("");
        // Refresh details
        const detailsRes = await getLeadByIdAction(selectedLead.id);
        if (detailsRes.success) setFullLead(detailsRes.data);
        router.refresh();
      } else {
        setActionError(res.error || "Error al programar tarea.");
      }
    } catch (err: any) {
      setActionError(err.message || "Error al procesar la solicitud.");
    } finally {
      setSavingDrawerAction(false);
    }
  };

  const handlePrintDrawer = () => {
    const printContent = document.getElementById("printable-lead-drawer");
    if (!printContent) return;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    window.location.reload();
  };

  const handleShareLead = () => {
    if (typeof window !== "undefined" && selectedLead) {
      const url = `${window.location.origin}/crm/${selectedLead.id}`;
      navigator.clipboard.writeText(url);
      showToast("Enlace de ficha 360° copiado al portapapeles");
    }
  };

  // Mutator - Asignar Vendedor (Cascade to crmPipeline and crmOpportunities)
  const handleAssignSeller = async (newEmail: string) => {
    if (!selectedLead) return;
    setActionError("");
    setIsPending(true);
    try {
      const res = await updateCommercialDataAction(selectedLead.id, newEmail, selectedLead.probability || 20);
      if (res.success) {
        showToast(`Lead reasignado exitosamente a: ${newEmail}`);
        // Refresh details
        const detailsRes = await getLeadByIdAction(selectedLead.id);
        if (detailsRes.success) setFullLead(detailsRes.data);
        router.refresh();
      } else {
        setActionError(res.error || "No se pudo actualizar el asesor comercial.");
        showToast(res.error || "Permisos insuficientes", "error");
      }
    } catch (err: any) {
      setActionError(err.message);
      showToast(err.message || "Error de red", "error");
    } finally {
      setIsPending(false);
    }
  };

  // Mutator - Cambiar Etapa Comercial (Cascade to crmPipeline and crmOpportunities)
  const handleStageChange = async (newStage: string) => {
    if (!selectedLead) return;
    setActionError("");
    setIsPending(true);
    const previousLeads = [...localLeads];
    
    // Optimistic Update
    setLocalLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, status: newStage, updatedAt: new Date() } : l));

    try {
      const res = await updateLeadStatusAction(selectedLead.id, newStage);
      if (res.success) {
        showToast(`Etapa comercial actualizada a: ${newStage.toUpperCase()}`);
        // Refresh details
        const detailsRes = await getLeadByIdAction(selectedLead.id);
        if (detailsRes.success) setFullLead(detailsRes.data);
        router.refresh();
      } else {
        throw new Error(res.error || "No se pudo actualizar la etapa comercial.");
      }
    } catch (err: any) {
      // Rollback on failure
      setLocalLeads(previousLeads);
      setActionError(err.message);
      showToast(err.message || "Error de red", "error");
    } finally {
      setIsPending(false);
    }
  };

  // Mutator - Cambiar Temperatura (Risk Level & Score)
  const handleRiskLevelChange = async (newRisk: string) => {
    if (!selectedLead) return;
    setActionError("");
    setIsPending(true);
    const previousLeads = [...localLeads];

    // Optimistic Update
    setLocalLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, riskLevel: newRisk } : l));

    try {
      const res = await updateLeadRiskLevelAction(selectedLead.id, newRisk);
      if (res.success) {
        showToast(`Temperatura comercial actualizada a: ${newRisk}`);
        // Refresh details
        const detailsRes = await getLeadByIdAction(selectedLead.id);
        if (detailsRes.success) setFullLead(detailsRes.data);
        router.refresh();
      } else {
        throw new Error(res.error || "No se pudo actualizar la temperatura.");
      }
    } catch (err: any) {
      // Rollback on failure
      setLocalLeads(previousLeads);
      setActionError(err.message);
      showToast(err.message || "Error de red", "error");
    } finally {
      setIsPending(false);
    }
  };

  const handleWhatsAppTrigger = () => {
    if (!selectedLead) return;
    const cleanPhone = selectedLead.phone.replace(/[^0-9+]/g, "");
    const templateMsg = `Hola ${selectedLead.fullName}, soy del equipo de ingeniería de CYH. Vi tu diagnóstico técnico para tu planta de ${selectedLead.companyName || "su empresa"} y me gustaría agendar una breve sesión técnica de 10 minutos para revisar los caudales y especificaciones de diseño. ¿Cómo está tu agenda esta semana?`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(templateMsg)}`;
    window.open(waUrl, "_blank");
  };

  const displayCompanyName = (lead: CombinedLead) => {
    if (lead.companyName) return lead.companyName;
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-250 font-sans tracking-wide uppercase">
        Empresa sin registrar
      </span>
    );
  };

  const displayContactName = (lead: CombinedLead) => {
    if (lead.fullName) return lead.fullName;
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-250 font-sans tracking-wide uppercase">
        Contacto sin registrar
      </span>
    );
  };

  const displayServiceName = (type: string) => {
    if (type === "fabricacion") return "Fabricación";
    if (type === "venta") return "Venta Equipos";
    if (type === "mantenimiento") return "Mantenimiento";
    if (type === "reparacion") return "Reparación";
    if (type === "ventilacion") return "Ventilación";
    if (type === "extraccion") return "Extracción";
    if (type === "climatizacion" || type === "control_termico") return "Control Térmico";
    return type;
  };

  const tabs = [
    { label: "Resumen", value: "resumen" },
    { label: "Diagnósticos", value: "diagnosticos" },
    { label: "Actividades", value: "actividades" },
    { label: "Propuestas", value: "propuestas" },
    { label: "Notas", value: "notas" }
  ];

  // Filtering Logic
  const filteredLeads = localLeads.filter((lead) => {
    const matchesSearch = 
      (lead.companyName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.city || "").toLowerCase().includes(searchTerm.toLowerCase());

    let matchesAssignee = true;
    if (filterAssignee !== "all") {
      const leadAssignee = (lead as any).assignedTo || "";
      matchesAssignee = leadAssignee.toLowerCase() === filterAssignee.toLowerCase();
    }

    let matchesService = true;
    if (filterService !== "all") {
      if (filterService === "ventilacion") {
        matchesService = ["ventilacion", "fabricacion", "venta"].includes(lead.serviceType);
      } else if (filterService === "extraccion") {
        matchesService = ["extraccion", "reparacion"].includes(lead.serviceType);
      } else if (filterService === "control_termico") {
        matchesService = ["control_termico", "climatizacion", "mantenimiento"].includes(lead.serviceType);
      } else {
        matchesService = lead.serviceType === filterService;
      }
    }

    return matchesSearch && matchesAssignee && matchesService;
  });

  // Calculate Metrics
  const openLeads = filteredLeads.filter(l => l.status !== "ganado" && l.status !== "perdido");
  
  // Forecast pipeline calculations
  let weightedPipelineValue = 0;
  openLeads.forEach(l => {
    const stageConf = STAGES.find(s => s.id === l.status);
    const prob = stageConf ? stageConf.prob : 10;
    weightedPipelineValue += (l.estimatedBudgetMax || 0) * (prob / 100);
  });

  return (
    <div className="w-full px-6 py-6 flex flex-col space-y-6 bg-[#F8FAFC] font-sans text-slate-900 min-h-full h-auto md:h-full md:overflow-hidden overflow-visible relative">
      
      {/* Toast Alert */}
      {toast.show && (
        <div className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded shadow-lg border text-sm font-semibold transition-all duration-300 animate-slide-up ${
          toast.type === "success" 
            ? "bg-slate-900 text-white border-slate-800" 
            : "bg-red-50 text-red-900 border-red-200"
        }`}>
          {toast.type === "success" ? <Check className="w-4 h-4 text-accent-cyan" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* HEADER & FILTROS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 border-b border-slate-200 pb-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-display font-black tracking-widest uppercase text-slate-900">
              Pipeline Comercial
            </h1>
            {isPending && <Loader2 className="w-4.5 h-4.5 text-slate-500 animate-spin" />}
          </div>
          <p className="text-slate-500 text-xs mt-1 font-semibold uppercase tracking-wider">Gestión B2B Enterprise de CYH Ingeniería.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Barra de Búsqueda */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <div className="relative w-full sm:w-60">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar empresa, contacto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 w-full bg-white border border-slate-200 rounded text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-400 transition-all"
              />
            </div>
            <button 
              onClick={() => { router.refresh(); showToast("Embudo comercial actualizado."); }}
              title="Refrescar"
              className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded transition-colors shadow-xs flex items-center justify-center shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
            </button>
            
            {/* Selector de Tipo de Vista */}
            <div className="border border-slate-200 rounded bg-white p-0.5 flex items-center shadow-xs shrink-0 select-none">
              <button
                onClick={() => handleViewChange("kanban")}
                className={`p-1 rounded transition-colors flex items-center justify-center ${
                  viewMode === "kanban" 
                    ? "bg-slate-900 text-white" 
                    : "text-slate-550 hover:text-slate-800 hover:bg-slate-50"
                }`}
                title="Vista Kanban"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleViewChange("list")}
                className={`p-1 rounded transition-colors flex items-center justify-center ${
                  viewMode === "list" 
                    ? "bg-slate-900 text-white" 
                    : "text-slate-550 hover:text-slate-800 hover:bg-slate-50"
                }`}
                title="Vista de Lista Ejecutiva"
              >
                <Rows className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filtro Asesor (Solo para Admin/Director) */}
          {["admin", "director_comercial"].includes(currentUser.role) ? (
            <div className="relative w-full sm:w-48">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-slate-400" />
              </div>
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="pl-9 pr-8 py-1.5 w-full border border-slate-200 rounded text-xs text-slate-900 bg-white font-medium focus:outline-none focus:border-slate-400 cursor-pointer appearance-none"
              >
                <option value="all">Todos los Asesores</option>
                {allCrmUsers.filter(u => ["admin", "comercial", "director_comercial"].includes(u.role)).map(u => (
                  <option key={u.id} value={u.email}>{u.fullName || u.email}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="bg-slate-100 border border-slate-200 rounded px-3 py-1.5 text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-1.5 select-none">
              <Shield className="w-3.5 h-3.5" /> Mis Leads
            </div>
          )}

          {/* Filtro Servicio */}
          <div className="relative w-full sm:w-44">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-slate-400" />
            </div>
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
              className="pl-9 pr-8 py-1.5 w-full border border-slate-200 rounded text-xs text-slate-900 bg-white font-medium focus:outline-none focus:border-slate-400 cursor-pointer appearance-none"
            >
              <option value="all">Todos los Servicios</option>
              <option value="ventilacion">Ventilación</option>
              <option value="extraccion">Extracción</option>
              <option value="control_termico">Control Térmico</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4 ADVANCED KPIs Requeridos */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white border border-slate-200 p-5 rounded shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-3">
            <div className="p-2 bg-slate-100 rounded">
              <Clock className="w-4 h-4 text-slate-700" />
            </div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest">Leads sin contacto</h3>
          </div>
          <p className="text-2xl font-black font-display text-slate-950">{filteredLeads.filter(l => l.status === "nuevo").length}</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-3">
            <div className="p-2 bg-red-50 rounded">
              <AlertCircle className="w-4 h-4 text-red-650" />
            </div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest">Leads Críticos (HOT)</h3>
          </div>
          <p className="text-2xl font-black font-display text-slate-950">{filteredLeads.filter(l => l.riskLevel === "HOT" && l.status !== "ganado" && l.status !== "perdido").length}</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-3">
            <div className="p-2 bg-slate-100 rounded">
              <Calendar className="w-4 h-4 text-slate-700" />
            </div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest">En Mesa de Reunión</h3>
          </div>
          <p className="text-2xl font-black font-display text-slate-950">{filteredLeads.filter(l => l.status === "reunion").length}</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-3">
            <div className="p-2 bg-slate-900 rounded">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest">Forecast Ponderado</h3>
          </div>
          <p className="text-2xl font-black font-display text-slate-950">
            ${Math.round(weightedPipelineValue).toLocaleString()} <span className="text-xs font-semibold text-slate-400">COP</span>
          </p>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="flex-1 overflow-auto bg-white border border-slate-200">
          {/* Vista para Pantallas de Escritorio (Tabla) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-250 bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider select-none">
                  <th className="py-2.5 px-3">Empresa</th>
                  <th className="py-2.5 px-3">Contacto</th>
                  <th className="py-2.5 px-3">Ciudad / Planta</th>
                  <th className="py-2.5 px-3">Servicio</th>
                  <th className="py-2.5 px-3">Presupuesto Máx</th>
                  <th className="py-2.5 px-3">Asesor</th>
                  <th className="py-2.5 px-3">Temperatura</th>
                  <th className="py-2.5 px-3">Etapa Comercial</th>
                  <th className="py-2.5 px-3 text-right">Ficha</th>
                </tr>
              </thead>
              <tbody>
                {STAGES.map((stage) => {
                  const stageLeads = filteredLeads.filter(l => l.status === stage.id);
                  if (stageLeads.length === 0) return null;

                  return (
                    <React.Fragment key={stage.id}>
                      {/* Cabecera de Etapa */}
                      <tr className="bg-slate-100/60 border-b border-slate-200">
                        <td colSpan={9} className="py-2 px-3 text-[10px] font-black uppercase tracking-wider text-slate-800 select-none">
                          {stage.name} <span className="ml-1 text-[9px] text-slate-450 font-bold bg-white border px-1.5 py-0.25 rounded-full">{stageLeads.length}</span>
                        </td>
                      </tr>
                      
                      {/* Leads de la etapa */}
                      {stageLeads.map((lead) => {
                        const budgetMax = lead.estimatedBudgetMax;

                        return (
                          <tr 
                            key={lead.id} 
                            onClick={() => { setSelectedLeadId(lead.id); setActionError(""); }}
                            className="border-b border-slate-150 hover:bg-slate-50/50 cursor-pointer transition-colors font-medium text-slate-700"
                          >
                            <td className="py-2 px-3 font-bold text-slate-900 uppercase">
                              {displayCompanyName(lead)}
                            </td>
                            <td className="py-2 px-3 truncate max-w-[150px]" title={lead.fullName || "Dato Incompleto"}>
                              {displayContactName(lead)}
                            </td>
                            <td className="py-2 px-3">
                              {renderCity(lead.city)}
                            </td>
                            <td className="py-2 px-3 capitalize">
                              {displayServiceName(lead.serviceType)}
                            </td>
                            <td className="py-2 px-3 font-mono">
                              {budgetMax 
                                ? `$${Math.round(budgetMax).toLocaleString()} COP` 
                                : <span className="text-slate-400 italic text-[10px]">No asignado</span>
                              }
                            </td>
                            <td className="py-2 px-3 truncate max-w-[120px]" title={lead.assignedTo || ""}>
                              {lead.assignedTo || <span className="text-slate-400 italic">Sin asignar</span>}
                            </td>
                            <td className="py-2 px-3">
                              <span className={`text-[8px] px-1.5 py-0.25 rounded font-black border uppercase ${
                                lead.riskLevel === "HOT" ? "bg-red-50 text-red-705 border-red-200" :
                                lead.riskLevel === "WARM" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                lead.riskLevel === "SPAM" ? "bg-slate-100 text-slate-400 border-slate-200" :
                                "bg-blue-50 text-blue-700 border-blue-200"
                              }`}>
                                {lead.riskLevel}
                              </span>
                            </td>
                            <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={lead.status}
                                disabled={isPending}
                                onChange={async (e) => {
                                  const targetStage = e.target.value;
                                  if (targetStage === lead.status) return;

                                  // Optimistic Update
                                  const previousLeads = [...localLeads];
                                  const updatedLeads = localLeads.map(l => 
                                    l.id === lead.id ? { ...l, status: targetStage, updatedAt: new Date() } : l
                                  );
                                  setLocalLeads(updatedLeads);
                                  setIsPending(true);

                                  try {
                                    const res = await updateLeadStatusAction(lead.id, targetStage);
                                    if (res.success) {
                                      showToast("Etapa de oportunidad comercial actualizada.");
                                      router.refresh();
                                    } else {
                                      throw new Error(res.error || "Permisos insuficientes.");
                                    }
                                  } catch (err: any) {
                                    console.error("List view stage update failed:", err);
                                    // ROLLBACK on failure
                                    setLocalLeads(previousLeads);
                                    showToast(err.message || "No se pudo actualizar el lead. Permisos insuficientes.", "error");
                                  } finally {
                                    setIsPending(false);
                                  }
                                }}
                                className="bg-slate-50 border border-slate-200 text-[10px] font-bold uppercase tracking-wide text-slate-800 rounded px-1.5 py-0.5 focus:outline-none focus:border-slate-400 cursor-pointer font-sans"
                              >
                                {STAGES.map((s) => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedLeadId(lead.id);
                                  setActionError("");
                                }}
                                className="text-[10px] font-bold text-slate-900 hover:text-slate-600 uppercase tracking-wider"
                              >
                                Detalle 360° →
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Vista para Pantallas Móviles (Tarjetas de Fila Apiladas) */}
          <div className="block md:hidden space-y-6">
            {STAGES.map((stage) => {
              const stageLeads = filteredLeads.filter(l => l.status === stage.id);
              if (stageLeads.length === 0) return null;

              return (
                <div key={stage.id} className="space-y-3">
                  {/* Cabecera de Etapa */}
                  <div className="bg-slate-100 px-3 py-2 rounded text-[10px] font-black uppercase tracking-wider text-slate-800 flex justify-between items-center select-none">
                    <span>{stage.name}</span>
                    <span className="text-[9px] text-slate-500 font-bold bg-white border px-1.5 py-0.25 rounded-full">
                      {stageLeads.length}
                    </span>
                  </div>

                  {/* Lista Apilada */}
                  <div className="space-y-3">
                    {stageLeads.map((lead) => {
                      const daysInactive = Math.floor((Date.now() - new Date(lead.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
                      const isAlert = stage.id !== 'ganado' && stage.id !== 'perdido';

                      let alertBorder = "border-slate-200";
                      if (isAlert) {
                        if (daysInactive >= 14) alertBorder = "border-red-400 shadow-[0_0_8px_rgba(220,38,38,0.15)]";
                        else if (daysInactive >= 7) alertBorder = "border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.15)]";
                      }

                      const ledBorderClass = 
                        lead.riskLevel === "HOT" ? "border-l-4 border-l-[#DC2626]" :
                        lead.riskLevel === "WARM" ? "border-l-4 border-l-[#D97706]" :
                        lead.riskLevel === "LOW" ? "border-l-4 border-l-[#64748B]" : 
                        "border-l-4 border-l-slate-400";

                      return (
                        <div
                          key={lead.id}
                          onClick={() => { setSelectedLeadId(lead.id); setActionError(""); }}
                          className={`bg-white border ${alertBorder} ${ledBorderClass} p-4 rounded shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col gap-3 relative overflow-hidden w-full`}
                        >
                          {/* Fila superior: Empresa y Temperatura */}
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-xs font-bold text-slate-900 uppercase tracking-wide truncate max-w-[70%]">
                              {displayCompanyName(lead)}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isAlert && daysInactive >= 7 && (
                                <span className="flex items-center gap-0.5 text-orange-600 font-black text-[9px]">
                                  <Clock className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
                                  {daysInactive}d
                                </span>
                              )}
                              <span className={`text-[8px] px-1.5 py-0.25 rounded font-black border uppercase ${
                                lead.riskLevel === "HOT" ? "bg-red-50 text-red-700 border-red-200" :
                                lead.riskLevel === "WARM" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                lead.riskLevel === "SPAM" ? "bg-slate-100 text-slate-400 border-slate-200" :
                                "bg-blue-50 text-blue-700 border-blue-200"
                              }`}>
                                {lead.riskLevel}
                              </span>
                            </div>
                          </div>

                          {/* Detalles del Contacto */}
                          <div className="text-[11px] text-slate-650 font-semibold grid grid-cols-2 gap-2 border-b border-slate-100/60 pb-2">
                            <div>
                              <span className="text-[8px] text-slate-400 uppercase tracking-wider block">Contacto Principal</span>
                              <span className="text-slate-900 block truncate">{displayContactName(lead)}</span>
                            </div>
                            <div>
                              <span className="text-[8px] text-slate-400 uppercase tracking-wider block">Cargo</span>
                              <span className="text-slate-900 block truncate">{lead.cargo || "Sin registrar"}</span>
                            </div>
                          </div>

                          {/* Ciudad y Caudal CFM */}
                          <div className="text-[11px] text-slate-650 font-semibold grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1.5 truncate">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{renderCity(lead.city)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-mono truncate">
                              <Wind className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{renderAirflow(lead.airflow)}</span>
                            </div>
                          </div>

                          {/* Caja de Presupuesto y Selector de Etapas */}
                          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 border-t border-slate-100 pt-2 mt-1">
                            <div className="bg-[#EDF1F3] border border-slate-300/85 px-2.5 py-1 rounded flex items-center justify-between text-[10px] font-mono shadow-inner w-full sm:w-auto">
                              <span className="text-[8px] font-black text-slate-450 uppercase tracking-widest mr-2">VALOR ESTIMADO</span>
                              <span className="font-black text-slate-950 font-mono">
                                {lead.estimatedBudgetMax 
                                  ? `$${Math.round(lead.estimatedBudgetMax).toLocaleString()} COP` 
                                  : "SIN ASIGNAR"
                                }
                              </span>
                            </div>

                            <div className="w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={lead.status}
                                disabled={isPending}
                                onChange={async (e) => {
                                  const targetStage = e.target.value;
                                  if (targetStage === lead.status) return;

                                  const previousLeads = [...localLeads];
                                  const updatedLeads = localLeads.map(l => 
                                    l.id === lead.id ? { ...l, status: targetStage, updatedAt: new Date() } : l
                                  );
                                  setLocalLeads(updatedLeads);
                                  setIsPending(true);

                                  try {
                                    const res = await updateLeadStatusAction(lead.id, targetStage);
                                    if (res.success) {
                                      showToast("Etapa de oportunidad comercial actualizada.");
                                      router.refresh();
                                    } else {
                                      throw new Error(res.error || "Permisos insuficientes.");
                                    }
                                  } catch (err: any) {
                                    setLocalLeads(previousLeads);
                                    showToast(err.message || "No se pudo actualizar el lead. Permisos insuficientes.", "error");
                                  } finally {
                                    setIsPending(false);
                                  }
                                }}
                                className="w-full bg-slate-50 border border-slate-200 text-[10px] font-bold uppercase tracking-wide text-slate-800 rounded px-2.5 py-1 focus:outline-none focus:border-slate-400 cursor-pointer font-sans"
                              >
                                {STAGES.map((s) => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </select>
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
        </div>
      ) : (
        <div className="flex-grow flex-1 min-h-0 w-full md:overflow-x-auto md:overflow-y-hidden overflow-visible pb-4 scrollbar-thin">
          <div className="flex flex-col md:flex-row gap-4 h-auto md:h-full pb-2">
            {STAGES.map((stage) => {
              let stageLeads = filteredLeads.filter(l => l.status === stage.id);
              const colValue = stageLeads.reduce((acc, l) => acc + (l.estimatedBudgetMax || 0), 0);
              const isDraggedOver = draggedOverStage === stage.id;

              return (
                <div
                  key={stage.id}
                  onDragOver={(e) => handleDragOver(e, stage.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage.id)}
                  className={`w-full md:w-[290px] flex-shrink-0 md:snap-center bg-slate-100/50 border rounded flex flex-col transition-all h-auto md:h-full ${
                    isDraggedOver ? "border-slate-800 bg-slate-100 shadow-sm" : "border-slate-200"
                  }`}
                >
                  {/* Column Header */}
                  <div className={`p-4 border-b border-slate-200 shrink-0 ${stage.bg} rounded-t flex flex-col gap-0.5`}>
                    <div className="flex justify-between items-center">
                      <h3 className={`text-xs font-bold ${stage.text} tracking-wider uppercase truncate pr-2`}>{stage.name}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-white rounded border border-slate-200 text-slate-800 flex-shrink-0 shadow-xs">
                        {stageLeads.length}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-450 mt-1">
                      ${Math.round(colValue).toLocaleString()} COP
                    </p>
                  </div>

                  {/* Cards Container */}
                  <div className="p-3 flex-1 md:overflow-y-auto overflow-visible space-y-3 scrollbar-thin scrollbar-thumb-slate-300">
                    {stageLeads.map((lead) => {
                      const daysInactive = Math.floor((Date.now() - new Date(lead.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
                      const isAlert = stage.id !== 'ganado' && stage.id !== 'perdido';
                      
                      let alertBorder = "border-slate-200";
                      if (isAlert) {
                        if (daysInactive >= 14) alertBorder = "border-red-400 shadow-[0_0_8px_rgba(220,38,38,0.15)]";
                        else if (daysInactive >= 7) alertBorder = "border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.15)]";
                      }

                      const ledBorderClass = 
                        lead.riskLevel === "HOT" ? "border-l-4 border-l-[#DC2626]" :
                        lead.riskLevel === "WARM" ? "border-l-4 border-l-[#D97706]" :
                        lead.riskLevel === "LOW" ? "border-l-4 border-l-[#64748B]" : 
                        "border-l-4 border-l-slate-400";

                      return (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          onMouseDown={handleMouseDown}
                          onMouseUp={(e) => handleMouseUp(e, lead.id)}
                          className={`bg-white border ${alertBorder} ${ledBorderClass} p-2.5 rounded shadow-xs hover:-translate-y-0.5 hover:shadow-md cursor-grab active:cursor-grabbing transition-all group flex flex-col gap-2 relative`}
                        >
                          {/* Linea 1: Empresa + Badge Temperatura / Grip */}
                          <div className="flex justify-between items-start gap-2">
                            <span 
                              className="text-xs font-bold text-slate-900 uppercase tracking-wide leading-tight line-clamp-1 flex-1 cursor-pointer hover:text-slate-650 transition-colors"
                              title={lead.companyName || "Dato Incompleto"}
                            >
                              {lead.companyName ? (
                                lead.companyName
                              ) : (
                                <span className="inline-block text-[8px] px-1 bg-amber-50 border border-amber-200 text-amber-850 font-bold uppercase rounded-sm font-sans">
                                  [Dato Incompleto]
                                </span>
                              )}
                            </span>
                            
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isAlert && daysInactive >= 7 && (
                                <span className="flex items-center gap-0.5 text-orange-600 font-black text-[9px]" title={`${daysInactive} días sin actividad`}>
                                  <Clock className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
                                  {daysInactive}d
                                </span>
                              )}
                              <span className={`text-[8px] px-1 py-0.25 rounded font-black border uppercase ${
                                lead.riskLevel === "HOT" ? "bg-red-50 text-red-700 border-red-200" :
                                lead.riskLevel === "WARM" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                lead.riskLevel === "SPAM" ? "bg-slate-100 text-slate-400 border-slate-200" :
                                "bg-blue-50 text-blue-700 border-blue-200"
                              }`}>
                                {lead.riskLevel}
                              </span>
                              <div 
                                data-drag-handle
                                onMouseDown={(e) => e.stopPropagation()}
                                onMouseUp={(e) => e.stopPropagation()}
                                className="cursor-grab active:cursor-grabbing p-0.5 text-slate-400 hover:text-slate-650 hover:bg-slate-100 rounded transition-colors shrink-0"
                                title="Arrastrar tarjeta"
                              >
                                <FolderKanban className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          </div>

                          {/* Linea 2: Datos Técnicos */}
                          <div className="text-[10px] text-slate-550 font-bold flex items-center gap-1.5 truncate select-none">
                            <span className="flex items-center gap-0.5 shrink-0">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {renderCity(lead.city)}
                            </span>
                            <span className="text-slate-300">|</span>
                            <span className="flex items-center gap-0.5 truncate">
                              <Wind className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {renderAirflow(lead.airflow)}
                            </span>
                          </div>

                          {/* Linea 3: Presupuesto max en caja ABB */}
                          <div className="bg-[#EDF1F3] border border-slate-300/85 p-1.5 rounded flex justify-between items-center text-[10px] font-mono shadow-inner select-none">
                            <span className="text-[8px] font-black text-slate-450 uppercase tracking-widest">VALOR ESTIMADO</span>
                            <span className="font-black text-slate-950 font-mono">
                              {lead.estimatedBudgetMax 
                                ? `$${Math.round(lead.estimatedBudgetMax).toLocaleString()} COP` 
                                : <span className="text-slate-400 font-bold italic text-[9px] uppercase">SIN ASIGNAR</span>
                              }
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {stageLeads.length === 0 && (
                      <div className="py-6 border border-dashed border-amber-200 rounded bg-amber-50/10 flex items-center justify-center text-[10px] font-bold text-amber-700 uppercase tracking-wider select-none">
                        [Sin leads en esta etapa]
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DRAWER FLOTANTE (PANEL DETALLE DERECHO 360°) */}
      <div 
        className={`fixed md:absolute top-0 right-0 h-full w-full max-w-[480px] bg-white shadow-[-15px_0_30px_rgba(0,0,0,0.08)] border-l border-slate-200 z-30 flex flex-col transform transition-transform duration-300 ease-in-out ${
          selectedLeadId ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedLead && (
          <div id="printable-lead-drawer" className="flex flex-col h-full overflow-hidden bg-white">
            
            {/* Header del Drawer */}
            <div className="p-6 pb-0 border-b border-slate-250 bg-slate-50">
              <div className="flex items-center justify-between mb-4">
                <span className="bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded">Lead Seleccionado</span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={handlePrintDrawer}
                    title="Imprimir Ficha"
                    className="w-8 h-8 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors"
                  >
                    <Printer className="w-4.5 h-4.5" />
                  </button>
                  <button 
                    onClick={handleShareLead}
                    title="Compartir Ficha"
                    className="w-8 h-8 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors"
                  >
                    <Share2 className="w-4.5 h-4.5" />
                  </button>
                  <button onClick={() => setSelectedLeadId(null)} className="w-8 h-8 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 bg-white border border-slate-200 rounded flex items-center justify-center shrink-0 shadow-xs">
                  <Building2 className="w-7 h-7 text-slate-800" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight uppercase">{displayCompanyName(selectedLead)}</h3>
                  <div className="text-[10px] text-slate-550 flex items-center gap-1 mt-1 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <div className="inline-block">{renderCity(selectedLead.city)}</div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                      selectedLead.riskLevel === 'HOT' ? 'bg-red-50 text-red-700 border border-red-200' :
                      selectedLead.riskLevel === 'WARM' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {selectedLead.riskLevel} Urgencia
                    </span>
                  </div>
                </div>
              </div>

              {/* Navegación por Pestañas */}
              <div className="flex overflow-x-auto no-scrollbar border-b border-slate-200">
                {tabs.map(t => (
                  <button 
                    key={t.value}
                    onClick={() => setActiveTab(t.value)}
                    className={`py-3 px-4 text-xs whitespace-nowrap transition-colors relative tracking-wider uppercase ${
                      activeTab === t.value 
                        ? 'text-slate-900 font-bold' 
                        : 'text-slate-500 hover:text-slate-900 font-semibold'
                    }`}
                  >
                    {t.label}
                    {activeTab === t.value && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message en Drawer */}
            {actionError && (
              <div className="m-6 mb-0 p-3 bg-red-50 border border-red-150 rounded text-xs text-red-900 font-semibold flex items-start gap-2 animate-scale-up">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Contenido de Pestañas */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
              {activeTab === 'resumen' && (
                <>
                  {/* BARRA DE ASIGNACIÓN Y ESTADO COMERCIAL */}
                  {currentUser.role !== 'tecnico' && currentUser.role !== 'ingeniero' ? (
                    <section className="bg-slate-50 border border-slate-250 p-4 rounded space-y-4 shadow-xs">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-1.5">Control de Asignación y Proceso</span>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                        <div className="space-y-1.5">
                          <label className="text-slate-500 uppercase tracking-wider block">Asesor Asignado</label>
                          <select
                            value={selectedLead.assignedTo || ""}
                            disabled={isPending}
                            onChange={(e) => handleAssignSeller(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-medium focus:outline-none focus:border-slate-400 disabled:opacity-55 cursor-pointer animate-none"
                          >
                            <option value="">Sin Asignar</option>
                            {allCrmUsers.filter(u => ["admin", "comercial", "director_comercial"].includes(u.role)).map(u => (
                              <option key={u.id} value={u.email}>{u.fullName || u.email}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-slate-500 uppercase tracking-wider block">Etapa Comercial</label>
                          <select
                            value={selectedLead.status || "nuevo"}
                            disabled={isPending}
                            onChange={(e) => handleStageChange(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-medium focus:outline-none focus:border-slate-400 disabled:opacity-55 cursor-pointer animate-none"
                          >
                            <option value="nuevo">Nuevo Lead</option>
                            <option value="contacto">Contacto Inicial</option>
                            <option value="reunion">Mesa Reunión</option>
                            <option value="diagnostico">Diagnóstico Técnico</option>
                            <option value="propuesta_prep">Propuesta Prep</option>
                            <option value="propuesta_entregada">Propuesta Enviada</option>
                            <option value="negociacion">Negociación</option>
                            <option value="ganado">Ganado (Cierre)</option>
                            <option value="perdido">Perdido</option>
                          </select>
                        </div>

                        <div className="space-y-1.5 col-span-2">
                          <label className="text-slate-500 uppercase tracking-wider block">Temperatura (Calificación)</label>
                          <select
                            value={selectedLead.riskLevel || "LOW"}
                            disabled={isPending}
                            onChange={(e) => handleRiskLevelChange(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-medium focus:outline-none focus:border-slate-400 disabled:opacity-55 cursor-pointer animate-none"
                          >
                            <option value="HOT">HOT 🔥 (Alta prioridad / Score &gt;= 75)</option>
                            <option value="WARM">WARM ☀️ (Interés medio / Score 45-74)</option>
                            <option value="LOW">LOW ❄️ (Fácil/Frecuente / Score 15-44)</option>
                            <option value="COLD">COLD ❄️ (Frío / Por calificar)</option>
                            <option value="SPAM">SPAM 🚫 (Descartado / Score &lt; 15)</option>
                          </select>
                        </div>
                      </div>
                    </section>
                  ) : (
                    <section className="bg-slate-50 border border-slate-200 p-4 rounded text-xs space-y-2 font-semibold text-slate-800">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-1.5">Asignación de Proceso comercial</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>Asesor: <span className="text-slate-950 font-bold">{selectedLead.assignedTo || "Sin asignar"}</span></div>
                        <div>Etapa: <span className="text-slate-950 font-bold uppercase">{selectedLead.status}</span></div>
                      </div>
                    </section>
                  )}

                  {/* Ficha de Contacto Rápido */}
                  <section className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-1">Ficha de Contacto</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Contacto Principal</span>
                        <span className="text-slate-900 font-bold">{displayContactName(selectedLead)}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Cargo / Rol</span>
                        <span className="text-slate-900 font-bold">
                          {selectedLead.cargo || <span className="text-red-500 bg-red-50 border border-red-200 px-1 py-0.5 rounded text-[9px] uppercase tracking-wider">Sin cargo</span>}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Teléfono Móvil</span>
                        <span className="text-slate-900 font-bold flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedLead.phone || "Sin registrar"}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Email Corporativo</span>
                        <span className="text-slate-900 font-bold block truncate">{selectedLead.email || "Sin registrar"}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleWhatsAppTrigger}
                        className="w-full py-2.5 border border-slate-350 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold uppercase tracking-wider text-[10px] rounded flex items-center justify-center gap-2 transition-all shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Contactar vía WhatsApp
                      </button>
                    </div>
                  </section>

                  {/* Variables Técnicas Wizard */}
                  <section className="space-y-3 bg-slate-50/50 p-4 border border-slate-150 rounded">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-1.5">Variables Técnicas wizard</h4>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs font-semibold">
                      <div>
                        <span className="text-[10px] text-slate-450 uppercase block">Ambiente Operativo</span>
                        <span className="text-slate-900 font-bold">{selectedLead.environmentType}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-450 uppercase block">Urgencia Técnica</span>
                        <span className="text-slate-900 font-bold capitalize">{selectedLead.urgencyLevel}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-450 uppercase block">Severidad Wizard</span>
                        <span className="text-slate-900 font-bold">
                          {selectedLead.severityScore !== null ? `${selectedLead.severityScore}/10` : <span className="text-slate-400 italic">No calculada</span>}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-450 uppercase block">Complejidad Wizard</span>
                        <span className="text-slate-900 font-bold">
                          {selectedLead.complexityScore !== null ? `${selectedLead.complexityScore}/10` : <span className="text-slate-400 italic">No calculada</span>}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-450 uppercase block">Score de Conversión</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-900" style={{ width: `${selectedLead.leadScore || 0}%` }}></div>
                          </div>
                          <span className="text-slate-900 font-bold">{selectedLead.leadScore || 0} pts</span>
                        </div>
                      </div>
                    </div>
                  </section>
                </>
              )}

              {activeTab === 'diagnosticos' && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-1.5">Reportes de Diagnóstico Técnico</h4>
                  {loadingDetails ? (
                    <div className="text-xs text-slate-400 italic flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando...</div>
                  ) : (fullLead?.diagnosticReports || []).length === 0 ? (
                    <div className="text-xs text-slate-400 italic">No hay diagnósticos técnicos registrados.</div>
                  ) : (
                    (fullLead.diagnosticReports).map((diag: any, idx: number) => (
                      <div key={diag.id} className="p-4 bg-slate-50 border border-slate-200 rounded space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                          <span className="font-bold text-xs text-slate-900">Diagnóstico #{idx + 1}</span>
                          <span className="bg-white px-2 py-0.5 rounded text-[9px] font-bold uppercase border border-slate-200 tracking-wider">{diag.status}</span>
                        </div>
                        <div className="space-y-2 text-xs font-semibold">
                          <div><span className="text-slate-450 uppercase text-[10px] block">Caudal de Aire</span> <span className="font-bold text-slate-900">{diag.airflow ? `${diag.airflow} CFM` : 'N/A'}</span></div>
                          <div><span className="text-slate-450 uppercase text-[10px] block">Observaciones Técnicas</span> <p className="text-slate-700 mt-0.5 leading-relaxed font-medium">{diag.technicalObservations || 'Sin observaciones'}</p></div>
                          <div><span className="text-slate-450 uppercase text-[10px] block">Recomendaciones</span> <p className="text-slate-700 mt-0.5 leading-relaxed font-medium">{diag.recommendations || 'Sin recomendaciones'}</p></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'actividades' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bitácora Comercial</h4>
                    {currentUser.role !== "tecnico" && currentUser.role !== "ingeniero" && (
                      <div className="flex gap-1">
                        <button 
                          onClick={() => { setActivityModalOpen(true); setActionError(""); }}
                          className="px-2 py-0.75 bg-slate-900 hover:bg-slate-800 text-white rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5 shadow-xs"
                        >
                          <Plus className="w-2.5 h-2.5" /> Registrar Actividad
                        </button>
                        <button 
                          onClick={() => { setTaskModalOpen(true); setActionError(""); }}
                          className="px-2 py-0.75 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5 shadow-xs"
                        >
                          <Calendar className="w-2.5 h-2.5 text-slate-400" /> Programar Tarea
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                    {loadingDetails ? (
                      <div className="text-xs text-slate-400 italic flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando...</div>
                    ) : (fullLead?.crmActivityLogs || []).length === 0 ? (
                      <div className="text-xs text-slate-400 italic">No hay actividades en el historial.</div>
                    ) : (
                      (fullLead.crmActivityLogs).map((act: any, idx: number) => (
                        <div key={act.id || idx} className="relative text-xs font-semibold">
                          <div className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center z-10">
                            <FileText className="w-3 h-3 text-slate-500" />
                          </div>
                          <p className="text-xs text-slate-900 font-bold uppercase tracking-wider">
                            {act.activityType === "call" ? "Llamada Telefónica" :
                             act.activityType === "email" ? "Correo Electrónico" :
                             act.activityType === "meeting" ? "Reunión Online" :
                             act.activityType === "visit" ? "Visita Técnica" :
                             act.activityType === "technical" ? "Seguimiento Técnico" :
                             act.activityType === "proposal" ? "Propuesta Entregada" :
                             act.activityType === "lead_created" ? "Lead Creado" :
                             act.activityType === "report_generated" ? "Preingeniería Generada" :
                             act.activityType === "status_changed" ? "Cambio de Estado" :
                             act.activityType.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-slate-750 mt-0.5 font-semibold leading-relaxed">{act.description}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-1">{new Date(act.createdAt).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'propuestas' && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-1.5">Propuestas Comerciales</h4>
                  {loadingDetails ? (
                    <div className="text-xs text-slate-400 italic flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando...</div>
                  ) : (fullLead?.crmProposals || []).length === 0 ? (
                    <div className="text-xs text-slate-400 italic">No hay propuestas registradas.</div>
                  ) : (
                    (fullLead.crmProposals).map((prop: any, idx: number) => (
                      <div key={prop.id} className="p-4 bg-slate-50 border border-slate-200 rounded space-y-3 font-semibold">
                        <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                          <span className="font-bold text-xs text-slate-900 truncate max-w-[200px]">{prop.title}</span>
                          <span className="bg-white px-2 py-0.5 rounded text-[9px] font-bold uppercase border border-slate-200 tracking-wider">{prop.status}</span>
                        </div>
                        <div className="space-y-1 text-xs font-semibold">
                          {currentUser.role !== "tecnico" && currentUser.role !== "ingeniero" ? (
                            <div><span className="text-slate-450 uppercase text-[10px] block">Valor Total</span> <span className="font-bold text-slate-900">${(prop.totalValue || 0).toLocaleString()} COP</span></div>
                          ) : (
                            <div><span className="text-slate-450 uppercase text-[10px] block">Valor Total</span> <span className="font-bold text-slate-400 italic">[Confidencial]</span></div>
                          )}
                          <div><span className="text-slate-450 uppercase text-[10px] block">Fecha Emisión</span> <span className="text-slate-700">{new Date(prop.createdAt).toLocaleDateString()}</span></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'notas' && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-1.5">Notas Comerciales</h4>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded text-xs text-slate-755 leading-relaxed font-semibold">
                    {selectedLead.notes || "No hay notas u observaciones adicionales registradas para este lead."}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Footer del Drawer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
              <div className="flex gap-2">
                <Link 
                  href={`/crm/${selectedLead.id}`} 
                  className="flex-1 bg-slate-900 text-white text-center py-2.5 rounded hover:bg-slate-800 font-bold uppercase tracking-wider text-[10px] transition-colors flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Ficha Técnica 360°
                </Link>
                <button 
                  onClick={() => setSelectedLeadId(null)}
                  className="w-12 h-[42px] border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center rounded transition-colors"
                >
                  <X className="w-4.5 h-4.5 text-slate-500" />
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* MODAL DRAWER: REGISTRAR ACTIVIDAD */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded w-full max-w-md p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-scale-up">
            <button onClick={() => setActivityModalOpen(false)} className="absolute top-4 right-4 text-slate-450 hover:text-slate-900 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Registrar Actividad</h3>
            <form onSubmit={handleCreateActivity} className="space-y-4 text-xs font-semibold">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipo de Actividad</label>
                <select 
                  value={activityTypeInput} 
                  onChange={e => setActivityTypeInput(e.target.value)}
                  required 
                  className="p-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-800 focus:border-slate-400 focus:outline-none cursor-pointer font-bold"
                >
                  <option value="call">Llamada Telefónica</option>
                  <option value="email">Correo Enviado</option>
                  <option value="meeting">Reunión Online</option>
                  <option value="visit">Visita Técnica</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Notas / Resumen</label>
                <textarea 
                  value={activityDescription}
                  onChange={e => setActivityDescription(e.target.value)}
                  required 
                  rows={3} 
                  placeholder="Detalles sobre lo acordado con el cliente..." 
                  className="p-2 bg-slate-50 border border-slate-255 rounded text-sm text-slate-805 focus:border-slate-400 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setActivityModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded text-[11px] font-bold uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button 
                  disabled={savingDrawerAction} 
                  type="submit" 
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  {savingDrawerAction ? "Guardando..." : "Guardar Actividad"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DRAWER: PROGRAMAR TAREA */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded w-full max-w-md p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-scale-up">
            <button onClick={() => setTaskModalOpen(false)} className="absolute top-4 right-4 text-slate-450 hover:text-slate-900 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Programar Tarea</h3>
            <form onSubmit={handleCreateTask} className="space-y-4 text-xs font-semibold">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipo de Tarea</label>
                <select 
                  value={taskTypeInput}
                  onChange={e => setTaskTypeInput(e.target.value)}
                  required 
                  className="p-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-800 focus:border-slate-400 focus:outline-none cursor-pointer font-bold"
                >
                  <option value="llamada">Llamada de Seguimiento</option>
                  <option value="reunion">Mesa de Trabajo Técnico</option>
                  <option value="propuesta">Preparar Cotización</option>
                  <option value="visita">Visita Técnica a Planta</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fecha</label>
                  <input 
                    type="date" 
                    required 
                    value={taskDueDateInput}
                    onChange={e => setTaskDueDateInput(e.target.value)}
                    className="p-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-800 focus:border-slate-400 focus:outline-none" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hora</label>
                  <input 
                    type="time" 
                    required 
                    value={taskDueTimeInput}
                    onChange={e => setTaskDueTimeInput(e.target.value)}
                    className="p-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-800 focus:border-slate-400 focus:outline-none" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Descripción / Notas</label>
                <textarea 
                  value={taskNotesInput}
                  onChange={e => setTaskNotesInput(e.target.value)}
                  required 
                  rows={3} 
                  placeholder="Detalles sobre la tarea..." 
                  className="p-2 bg-slate-50 border border-slate-250 rounded text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setTaskModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded text-[11px] font-bold uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button 
                  disabled={savingDrawerAction} 
                  type="submit" 
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  {savingDrawerAction ? "Guardando..." : "Programar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
