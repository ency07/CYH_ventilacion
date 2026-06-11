"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Filter, 
  Download, 
  Star, 
  Edit2, 
  X, 
  MoreHorizontal, 
  Phone, 
  FileText, 
  Mail, 
  MapPin, 
  Building2, 
  Plus, 
  MessageSquare,
  Printer, 
  Share2, 
  Loader2,
  Calendar,
  AlertTriangle,
  Check,
  User,
  Shield,
  Briefcase,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Drizzle Schema types for strict B2B contracts
import { leads, crmCompanies, crmUsers, crmTasks } from "@/lib/db/schema";

type Lead = typeof leads.$inferSelect;
type CrmCompany = typeof crmCompanies.$inferSelect;
type CrmUser = typeof crmUsers.$inferSelect;
type CrmTask = typeof crmTasks.$inferSelect;

interface MappedContact {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  email: string | null;
  phone: string | null;
  companyId: string | null;
}

// Server Actions
import { 
  getLeadByIdAction, 
  createLeadAction 
} from "@/lib/server-actions/leads";

import { 
  updateCommercialDataAction, 
  updateLeadStatusAction, 
  createActivityLogAction,
  updateLeadRiskLevelAction,
  createTaskAction
} from "@/lib/server-actions/crm";

export default function LeadsClient({ 
  leads = [], 
  companies = [], 
  contacts = [], 
  tasks = [],
  currentUser,
  allCrmUsers = []
}: { 
  leads: any[], 
  companies: CrmCompany[], 
  contacts: MappedContact[], 
  tasks: CrmTask[],
  currentUser: { name: string; role: string; email: string },
  allCrmUsers: CrmUser[]
}) {
  const router = useRouter();
  
  // Selected Lead Drawer state
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("resumen");
  const [fullLead, setFullLead] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [filterService, setFilterService] = useState("all");
  const [filterCity, setFilterCity] = useState("all");
  const [filterRiskLevel, setFilterRiskLevel] = useState("all");
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // UI mutation pending state
  const [isPending, setIsPending] = useState(false);
  const [actionError, setActionError] = useState("");

  // New Lead Modal State
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    fullName: "",
    companyName: "",
    email: "",
    phone: "",
    cargo: "",
    city: "",
    serviceType: "venta" as "fabricacion" | "venta" | "mantenimiento" | "reparacion" | "ventilacion" | "extraccion" | "climatizacion" | "control_termico",
    environmentType: "Industrial",
    urgencyLevel: "media" as "baja" | "media" | "alta" | "critica",
    notes: ""
  });
  const [submittingLead, setSubmittingLead] = useState(false);
  const [leadError, setLeadError] = useState("");

  // Drawer action states
  const [isActivityModalOpen, setActivityModalOpen] = useState(false);
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [activityTypeInput, setActivityTypeInput] = useState("call");
  const [activityDescription, setActivityDescription] = useState("");
  const [taskTypeInput, setTaskTypeInput] = useState("llamada");
  const [taskDueDateInput, setTaskDueDateInput] = useState("");
  const [taskDueTimeInput, setTaskDueTimeInput] = useState("");
  const [taskNotesInput, setTaskNotesInput] = useState("");
  const [savingDrawerAction, setSavingDrawerAction] = useState(false);

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

  const selectedLead = leads.find(l => l.id === selectedLeadId);
  const company = selectedLead ? companies.find(c => c.id === selectedLead.companyId) : null;
  const contact = selectedLead ? contacts.find(c => c.id === selectedLead.contactId) : null;

  // Filter Leads
  const filteredLeads = leads.filter((lead: any) => {
    const matchesSearch = 
      (lead.fullName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.companyName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.id || "").toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = filterStatus === "all" || lead.status === filterStatus;
    const matchesUrgency = filterUrgency === "all" || lead.urgencyLevel === filterUrgency;
    
    // Advanced Service mapping for B2B categories:
    // Ventilación: ventilacion, fabricacion, venta
    // Extracción: extraccion, reparacion
    // Control Térmico: climatizacion, control_termico, mantenimiento
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
    
    let matchesCity = true;
    if (filterCity !== "all") {
      matchesCity = (lead.city || "").toLowerCase().trim() === filterCity.toLowerCase().trim();
    }

    const matchesRiskLevel = filterRiskLevel === "all" || lead.riskLevel === filterRiskLevel;
    
    return matchesSearch && matchesStatus && matchesUrgency && matchesService && matchesCity && matchesRiskLevel;
  });

  // Extract unique cities from active leads to populate the city filter dynamically
  const uniqueCities = Array.from(new Set(leads.map(l => (l.city || "").trim()).filter(Boolean)));

  const handleExportCSV = () => {
    const headers = ["ID", "Empresa", "Contacto", "Email", "Telefono", "Ciudad", "Servicio", "Ambiente", "Urgencia", "Estado", "Origen", "Fecha de Creacion"];
    const rows = filteredLeads.map(l => [
      l.id,
      displayCompanyName(l),
      displayContactName(l),
      l.email || "",
      l.phone || "",
      l.city || "",
      l.serviceType || "",
      l.environmentType || "",
      l.urgencyLevel || "",
      l.status || "",
      l.source || "",
      l.createdAt ? new Date(l.createdAt).toLocaleDateString() : ""
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leads_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingLead(true);
    setLeadError("");
    try {
      const res = await createLeadAction({
        ...newLeadForm,
        status: "nuevo",
        source: "manual"
      });
      if (res.success) {
        setIsNewLeadOpen(false);
        setNewLeadForm({
          fullName: "",
          companyName: "",
          email: "",
          phone: "",
          cargo: "",
          city: "",
          serviceType: "venta",
          environmentType: "Industrial",
          urgencyLevel: "media",
          notes: ""
        });
        showToast("Lead creado con éxito");
        router.refresh();
      } else {
        setLeadError(res.error);
      }
    } catch (err: any) {
      setLeadError(err.message || "Error al crear el lead");
    } finally {
      setSubmittingLead(false);
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
    try {
      const res = await updateLeadStatusAction(selectedLead.id, newStage);
      if (res.success) {
        showToast(`Etapa comercial actualizada a: ${newStage.toUpperCase()}`);
        // Refresh details
        const detailsRes = await getLeadByIdAction(selectedLead.id);
        if (detailsRes.success) setFullLead(detailsRes.data);
        router.refresh();
      } else {
        setActionError(res.error || "No se pudo actualizar la etapa comercial.");
        showToast(res.error || "Permisos insuficientes", "error");
      }
    } catch (err: any) {
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
    try {
      const res = await updateLeadRiskLevelAction(selectedLead.id, newRisk);
      if (res.success) {
        showToast(`Temperatura comercial actualizada a: ${newRisk}`);
        // Refresh details
        const detailsRes = await getLeadByIdAction(selectedLead.id);
        if (detailsRes.success) setFullLead(detailsRes.data);
        router.refresh();
      } else {
        setActionError(res.error || "No se pudo actualizar la temperatura.");
        showToast(res.error || "Permisos insuficientes", "error");
      }
    } catch (err: any) {
      setActionError(err.message);
      showToast(err.message || "Error de red", "error");
    } finally {
      setIsPending(false);
    }
  };

  // WhatsApp template dispatch
  const handleWhatsAppTrigger = () => {
    if (!selectedLead) return;
    const cleanPhone = selectedLead.phone.replace(/[^0-9+]/g, "");
    const templateMsg = `Hola ${selectedLead.fullName}, soy del equipo de ingeniería de CYH. Vi tu diagnóstico técnico para tu planta de ${selectedLead.companyName || "su empresa"} y me gustaría agendar una breve sesión técnica de 10 minutos para revisar los caudales y especificaciones de diseño. ¿Cómo está tu agenda esta semana?`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(templateMsg)}`;
    window.open(waUrl, "_blank");
  };

  const tabs = [
    { label: "Resumen", value: "resumen" },
    { label: "Diagnósticos", value: "diagnosticos" },
    { label: "Actividades", value: "actividades" },
    { label: "Propuestas", value: "propuestas" },
    { label: "Notas", value: "notas" }
  ];

  const displayCompanyName = (lead: any) => {
    const c = companies.find(c => c.id === lead.companyId);
    if (c?.name) return c.name;
    if (lead.companyName) return lead.companyName;
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-250 font-sans tracking-wide uppercase">
        Empresa sin registrar
      </span>
    );
  };

  const displayContactName = (lead: any) => {
    const p = contacts.find(c => c.id === lead.contactId);
    if (p) return `${p.firstName} ${p.lastName}`;
    if (lead.fullName) return lead.fullName;
    if (lead.firstName || lead.lastName) return `${lead.firstName || ''} ${lead.lastName || ''}`.trim();
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

  return (
    <div className="relative flex-1 flex flex-col h-auto min-h-screen md:h-full overflow-visible md:overflow-hidden bg-[#F8FAFC] font-sans text-slate-900">
      
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

      {/* HEADER PRINCIPAL */}
      <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-display font-black tracking-widest uppercase">Leads Pipeline</h2>
          <span className="bg-slate-50 px-2 py-0.5 rounded text-[10px] font-bold text-slate-800 border border-slate-200 uppercase tracking-wider">{filteredLeads.length} / {leads.length} FILTRADOS</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar leads, empresas o ciudades..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded w-72 focus:outline-none focus:border-slate-400 font-medium" 
            />
          </div>
          
          <button 
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`px-3 py-1.5 border rounded flex items-center gap-2 transition-colors text-xs font-bold uppercase tracking-wider ${
              showFilterPanel 
                ? 'border-slate-800 bg-slate-100 text-slate-900' 
                : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" /> Panel Filtros
          </button>
          
          <button 
            onClick={handleExportCSV}
            className="px-3 py-1.5 border border-slate-200 bg-white text-slate-600 hover:text-slate-900 rounded flex items-center gap-2 hover:bg-slate-50 transition-colors text-xs font-bold uppercase tracking-wider"
          >
            <Download className="w-3.5 h-3.5" /> Exportar
          </button>
          
          {currentUser.role !== "tecnico" && currentUser.role !== "ingeniero" && (
            <button 
              onClick={() => setIsNewLeadOpen(true)}
              className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Nuevo Lead
            </button>
          )}
        </div>
      </div>

      {/* FILTER PANEL */}
      {showFilterPanel && (
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-4 shrink-0 font-sans text-xs">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estado Comercial</span>
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-900 font-medium outline-none focus:border-slate-400"
            >
              <option value="all">Todos los Estados</option>
              <option value="nuevo">Nuevo</option>
              <option value="contacto">Contacto Inicial</option>
              <option value="reunion">Mesa Reunión</option>
              <option value="diagnostico">Diagnóstico Técnico</option>
              <option value="propuesta_prep">Propuesta Prep</option>
              <option value="propuesta_entregada">Propuesta Enviada</option>
              <option value="negociacion">Negociación</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Urgencia</span>
            <select 
              value={filterUrgency} 
              onChange={e => setFilterUrgency(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-900 font-medium outline-none focus:border-slate-400"
            >
              <option value="all">Todas las Urgencias</option>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Servicio Industrial</span>
            <select 
              value={filterService} 
              onChange={e => setFilterService(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-900 font-medium outline-none focus:border-slate-400"
            >
              <option value="all">Todos los Servicios</option>
              <option value="ventilacion">Ventilación</option>
              <option value="extraccion">Extracción</option>
              <option value="control_termico">Control Térmico</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ciudad / Planta</span>
            <select 
              value={filterCity} 
              onChange={e => setFilterCity(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-900 font-medium outline-none focus:border-slate-400"
            >
              <option value="all">Todas las Ciudades</option>
              {uniqueCities.map((city, idx) => (
                <option key={idx} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Calificación de Riesgo / Score</span>
            <select 
              value={filterRiskLevel} 
              onChange={e => setFilterRiskLevel(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-900 font-medium outline-none focus:border-slate-400"
            >
              <option value="all">Todas las Temperaturas</option>
              <option value="HOT">HOT (Crítico / Score &gt;= 75)</option>
              <option value="WARM">WARM (Interés / Score 45-74)</option>
              <option value="LOW">LOW (Bajo / Score 15-44)</option>
              <option value="SPAM">SPAM (Descartado / Score &lt; 15)</option>
            </select>
          </div>

          <button 
            onClick={() => { setFilterStatus("all"); setFilterUrgency("all"); setFilterService("all"); setFilterCity("all"); setFilterRiskLevel("all"); setSearchQuery(""); }}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider rounded self-end transition-colors shadow-xs"
          >
            Limpiar Filtros
          </button>
        </div>
      )}

      {/* BANDEJA DE ENTRADA PRINCIPAL */}
      <div className="flex-1 overflow-visible md:overflow-auto w-full bg-white relative">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">
            <tr>
              <th className="p-4 pl-6 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">Empresa / Cliente</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">Contacto principal</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">Ubicación Planta</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">Servicio Solicitado</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 text-center">Temperatura</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">Fecha de Ingreso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-16 text-center text-xs text-slate-400 italic">No hay leads registrados que coincidan con la búsqueda.</td>
              </tr>
            ) : (
              filteredLeads.map((lead: any) => {
                const isSelected = lead.id === selectedLeadId;
                const dateRaw = new Date(lead.createdAt);
                
                return (
                  <tr 
                    key={lead.id} 
                    onClick={() => { setSelectedLeadId(lead.id); setActionError(""); }}
                    className={`cursor-pointer transition-colors group ${isSelected ? 'bg-slate-100/70' : 'hover:bg-slate-50/50'}`}
                  >
                    <td className="p-4 pl-6 relative">
                      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-900 rounded-r"></div>}
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-950 text-xs uppercase tracking-wide">{displayCompanyName(lead)}</span>
                        <span className="text-[9px] text-slate-400 font-mono uppercase mt-0.5">ID-{lead.id.substring(0,8).toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-xs font-semibold text-slate-900">{displayContactName(lead)}</p>
                      {lead.cargo ? (
                        <p className="text-[10px] text-slate-500 font-medium">{lead.cargo}</p>
                      ) : (
                        <span className="text-[9px] text-red-600 bg-red-50 border border-red-200 px-1 rounded font-bold uppercase">Sin Cargo</span>
                      )}
                    </td>
                    <td className="p-4 text-xs font-semibold text-slate-650">
                      {lead.city || <span className="text-slate-400 font-normal italic">Sin registrar</span>}
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-bold text-slate-900 capitalize">
                        {displayServiceName(lead.serviceType)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        lead.riskLevel === 'HOT' ? 'bg-red-50 text-red-700 border border-red-200' :
                        lead.riskLevel === 'WARM' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>{lead.riskLevel}</span>
                    </td>
                    <td className="p-4 text-xs text-slate-500 font-mono">
                      {format(dateRaw, 'dd/MM/yyyy')}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* DRAWER FLOTANTE (PANEL DETALLE DERECHO) */}
      <div 
        className={`absolute top-0 right-0 h-full w-full max-w-[480px] bg-white shadow-[-15px_0_30px_rgba(0,0,0,0.08)] border-l border-slate-200 z-30 flex flex-col transform transition-transform duration-300 ease-in-out ${
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
                  <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {selectedLead.city || 'No registrada'}
                  </p>
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
                  {/* BARRA DE ASIGNACIÓN Y ESTADO COMERCIAL (Exclusivo Comercial/Admin) */}
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
                            className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-medium focus:outline-none focus:border-slate-400 disabled:opacity-55 cursor-pointer"
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
                            className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-medium focus:outline-none focus:border-slate-400 disabled:opacity-55 cursor-pointer"
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
                            className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-medium focus:outline-none focus:border-slate-400 disabled:opacity-55 cursor-pointer"
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
                    // Ficha de Lectura para Técnicos
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

                    {/* WhatsApp Action Button */}
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
                        <div key={act.id || idx} className="relative text-xs">
                          <div className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center z-10">
                            <FileText className="w-3 h-3 text-slate-500" />
                          </div>
                          <p className="text-xs text-slate-900 font-bold uppercase tracking-wider capitalize">
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
                          <p className="text-xs text-slate-700 mt-0.5 font-medium">{act.description}</p>
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
                      <div key={prop.id} className="p-4 bg-slate-50 border border-slate-200 rounded space-y-3">
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

      {/* NEW LEAD MODAL */}
      {isNewLeadOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded w-full max-w-lg p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-scale-up">
            <button onClick={() => setIsNewLeadOpen(false)} className="absolute top-4 right-4 text-slate-450 hover:text-slate-900 transition-colors">
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-100 pb-3">Nuevo Lead</h3>
            {leadError && <p className="text-red-500 text-xs mb-4 font-bold">{leadError}</p>}
            
            <form onSubmit={handleCreateLead} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider block">Nombre Completo *</label>
                  <input 
                    required 
                    type="text"
                    name="fullName"
                    value={newLeadForm.fullName} 
                    onChange={e => setNewLeadForm({...newLeadForm, fullName: e.target.value})} 
                    className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-500" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider block">Empresa *</label>
                  <input 
                    required 
                    type="text"
                    name="companyName"
                    value={newLeadForm.companyName} 
                    onChange={e => setNewLeadForm({...newLeadForm, companyName: e.target.value})} 
                    className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider block">Email *</label>
                  <input 
                    required 
                    type="email"
                    name="email"
                    value={newLeadForm.email} 
                    onChange={e => setNewLeadForm({...newLeadForm, email: e.target.value})} 
                    className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-500" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider block">Teléfono * (Ej: +573001234567)</label>
                  <input 
                    required 
                    type="text"
                    name="phone"
                    value={newLeadForm.phone} 
                    onChange={e => setNewLeadForm({...newLeadForm, phone: e.target.value})} 
                    className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider block">Cargo / Puesto</label>
                  <input 
                    type="text"
                    name="cargo"
                    value={newLeadForm.cargo} 
                    onChange={e => setNewLeadForm({...newLeadForm, cargo: e.target.value})} 
                    className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-500" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider block">Ciudad *</label>
                  <input 
                    required
                    type="text"
                    name="city"
                    value={newLeadForm.city} 
                    onChange={e => setNewLeadForm({...newLeadForm, city: e.target.value})} 
                    className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider block">Servicio *</label>
                  <select 
                    name="serviceType"
                    value={newLeadForm.serviceType} 
                    onChange={e => setNewLeadForm({...newLeadForm, serviceType: e.target.value as any})}
                    className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-500"
                  >
                    <option value="venta">Venta Equipos</option>
                    <option value="fabricacion">Fabricación Especial</option>
                    <option value="mantenimiento">Mantenimiento Preventivo</option>
                    <option value="reparacion">Reparación / Overhaul</option>
                    <option value="ventilacion">Ventilación Industrial</option>
                    <option value="extraccion">Extracción de Contaminantes</option>
                    <option value="control_termico">Control Térmico / Clima</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider block">Ambiente *</label>
                  <input 
                    required 
                    type="text"
                    name="environmentType"
                    value={newLeadForm.environmentType} 
                    onChange={e => setNewLeadForm({...newLeadForm, environmentType: e.target.value})} 
                    className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-500" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider block">Urgencia *</label>
                  <select 
                    name="urgencyLevel"
                    value={newLeadForm.urgencyLevel} 
                    onChange={e => setNewLeadForm({...newLeadForm, urgencyLevel: e.target.value as any})}
                    className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-500"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 uppercase tracking-wider block">Notas Comerciales</label>
                <textarea 
                  name="notes"
                  value={newLeadForm.notes} 
                  onChange={e => setNewLeadForm({...newLeadForm, notes: e.target.value})} 
                  className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-500 h-20 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsNewLeadOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded hover:bg-slate-50 font-bold uppercase tracking-wider text-[10px]"
                >
                  Cancelar
                </button>
                <button 
                  disabled={submittingLead} 
                  type="submit" 
                  className="px-6 py-2.5 bg-slate-900 text-white rounded hover:bg-slate-800 disabled:bg-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-2"
                >
                  {submittingLead ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...
                    </>
                  ) : "Crear Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
                  <option value="call">WhatsApp</option>
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
                  className="p-2 bg-slate-50 border border-slate-250 rounded text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
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
