"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  DollarSign, 
  LineChart, 
  Target, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Download, 
  Printer, 
  Share2, 
  Calendar, 
  Phone, 
  Check, 
  Plus, 
  X, 
  ExternalLink, 
  Lock, 
  User, 
  Clock, 
  MapPin, 
  Mail, 
  AlertCircle,
  RefreshCw
} from "lucide-react";

// Drizzle Schema types for strict B2B contract verification
import { leads, crmUsers, crmTasks } from "@/lib/db/schema";

export type Lead = typeof leads.$inferSelect;
export type CrmUser = typeof crmUsers.$inferSelect;
export type CrmTask = typeof crmTasks.$inferSelect;

// Server Actions
import { 
  createTaskAction, 
  updateLeadStatusAction, 
  createActivityLogAction, 
  updateTaskStatusAction 
} from "@/lib/server-actions/crm";

import { colombiaMapPaths } from "@/lib/utils/colombiaMapPaths";
import { getDepartmentByCity } from "@/lib/utils/normalization";

const formatCOP = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const cityCoordinates: Record<string, { x: number; y: number }> = {
  "Barranquilla": { x: 150, y: 70 },
  "Cartagena": { x: 130, y: 80 },
  "Montería": { x: 110, y: 110 },
  "Medellín": { x: 140, y: 180 },
  "Bogotá": { x: 165, y: 220 },
  "Cali": { x: 110, y: 250 }
};

export interface GeoCityItem {
  city: typeof leads.$inferSelect['city'];
  projectCount: number;
  financialVolume: number;
}

export default function DashboardClient({ 
  currentUser, 
  allLeads,
  technicalMetrics,
  allUsers = [],
  allTasks = [],
  geoData = []
}: { 
  currentUser: { name: string, role: string, email: string },
  allLeads: Lead[],
  technicalMetrics?: any,
  allUsers?: CrmUser[],
  allTasks?: CrmTask[],
  geoData?: GeoCityItem[]
}) {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState("all");

  // Dialog States
  const [activeModal, setActiveModal] = useState<"meeting" | "contact" | "task" | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [modalStatus, setModalStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [modalErrorMessage, setModalErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // strict pending state for buttons
  const [isPending, setIsPending] = useState(false);

  // Geographic simulated loading state
  const [loadingGeo, setLoadingGeo] = useState(true);
  React.useEffect(() => {
    const timer = setTimeout(() => setLoadingGeo(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleReloadGeo = () => {
    setLoadingGeo(true);
    setTimeout(() => setLoadingGeo(false), 600);
  };

  const [hoveredCity, setHoveredCity] = useState<{
    city: string;
    projectCount: number;
    financialVolume: number;
    x: number;
    y: number;
  } | null>(null);

  const [hoveredDept, setHoveredDept] = useState<{
    name: string;
    projectCount: number;
    financialVolume: number;
    x: number;
    y: number;
  } | null>(null);

  // Custom Toast State
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success"
  });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4500);
  };

  // Form Fields - Dialog 1: Meeting
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingSpecialist, setMeetingSpecialist] = useState("");
  const [meetingLocType, setMeetingLocType] = useState<"virtual" | "physical">("virtual");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");

  // Form Fields - Dialog 2: Contact
  const [callResult, setCallResult] = useState("atendio");

  // Form Fields - Dialog 3: Task
  const [taskTitle, setTaskTitle] = useState("");
  const [taskLeadId, setTaskLeadId] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState("media");

  // Filter leads dynamically based on selected time range
  const getFilteredLeads = () => {
    if (timeRange === "all") return allLeads;
    const now = new Date();
    return allLeads.filter(lead => {
      const created = new Date(lead.createdAt);
      const diffMs = now.getTime() - created.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (timeRange === "month") return diffDays <= 30;
      if (timeRange === "quarter") return diffDays <= 90;
      return true;
    });
  };

  const filteredLeads = getFilteredLeads();

  // KPIs Calculations
  const totalLeads = filteredLeads.length;
  const ganados = filteredLeads.filter(l => l.status === 'ganado').length;
  const perdidos = filteredLeads.filter(l => l.status === 'perdido').length;
  const abiertos = totalLeads - ganados - perdidos;
  
  // KPI: Technical Meeting Scheduled Count and Rate (Converting cold leads)
  const reunionesAgendadas = filteredLeads.filter(l => 
    ["reunion", "diagnostico", "propuesta_prep", "propuesta_entregada", "negociacion", "ganado"].includes(l.status)
  ).length;
  const agendamientoRate = totalLeads > 0 ? ((reunionesAgendadas / totalLeads) * 100).toFixed(1) : "0.0";

  const getProbability = (stage: string) => {
    switch (stage) {
      case 'nuevo': return 0.10;
      case 'contacto': return 0.20;
      case 'diagnostico': return 0.40;
      case 'reunion': return 0.50;
      case 'propuesta_prep': return 0.60;
      case 'propuesta_entregada': return 0.70;
      case 'negociacion': return 0.80;
      case 'ganado': return 1.0;
      case 'perdido': return 0.0;
      default: return 0.0;
    }
  };

  let pipelineTotal = 0;
  let pipelineProbable = 0;

  filteredLeads.forEach(lead => {
    if (lead.status !== 'perdido') {
      const valor = lead.estimatedBudgetMax || 0;
      pipelineTotal += valor;
      pipelineProbable += valor * getProbability(lead.status);
    }
  });

  // Funnel calculations
  const stageNuevos = filteredLeads.length;
  const stageContacto = filteredLeads.filter(l => l.status !== "nuevo").length;
  const stageReunion = filteredLeads.filter(l => ["reunion", "diagnostico", "propuesta_prep", "propuesta_entregada", "negociacion", "ganado"].includes(l.status)).length;
  const stagePropuesta = filteredLeads.filter(l => ["propuesta_prep", "propuesta_entregada", "negociacion", "ganado"].includes(l.status)).length;
  const stageGanado = filteredLeads.filter(l => l.status === "ganado").length;

  const pctContacto = stageNuevos > 0 ? Math.round((stageContacto / stageNuevos) * 100) : 0;
  const pctReunion = stageNuevos > 0 ? Math.round((stageReunion / stageNuevos) * 100) : 0;
  const pctPropuesta = stageNuevos > 0 ? Math.round((stagePropuesta / stageNuevos) * 100) : 0;
  const pctGanado = stageNuevos > 0 ? Math.round((stageGanado / stageNuevos) * 100) : 0;

  // Dynamic distribution of solution types grouped by macro-industry solutions
  const solutionsData = () => {
    let ventilacionCount = 0;
    let extraccionCount = 0;
    let termicoCount = 0;
    
    filteredLeads.forEach(l => {
      const s = l.serviceType || "fabricacion";
      if (["ventilacion", "fabricacion", "venta"].includes(s)) {
        ventilacionCount++;
      } else if (["extraccion", "reparacion"].includes(s)) {
        extraccionCount++;
      } else {
        termicoCount++;
      }
    });
    
    const total = ventilacionCount + extraccionCount + termicoCount;
    
    return [
      { label: "Ventilación Industrial", count: ventilacionCount, pct: total > 0 ? Math.round((ventilacionCount / total) * 100) : 0 },
      { label: "Extracción de Contaminantes", count: extraccionCount, pct: total > 0 ? Math.round((extraccionCount / total) * 100) : 0 },
      { label: "Control Térmico y HVAC", count: termicoCount, pct: total > 0 ? Math.round((termicoCount / total) * 100) : 0 },
    ].sort((a, b) => b.count - a.count);
  };

  const deptDataMap = React.useMemo(() => {
    const map: Record<string, { projectCount: number; financialVolume: number }> = {};
    
    // Initialize all departments from colombiaMapPaths with 0s
    Object.keys(colombiaMapPaths).forEach(dept => {
      map[dept] = { projectCount: 0, financialVolume: 0 };
    });

    geoData.forEach(item => {
      if (!item.city || item.city === "[Por Clasificar]") return;
      const dept = getDepartmentByCity(item.city);
      if (!dept) return;

      if (!map[dept]) {
        map[dept] = { projectCount: 0, financialVolume: 0 };
      }
      map[dept].projectCount += item.projectCount;
      map[dept].financialVolume += item.financialVolume;

      // Group Bogotá capital inside Cundinamarca
      if (dept === "Cundinamarca") {
        const capitalDept = "Distrito Capital de Bogotá";
        if (map[capitalDept]) {
          map[capitalDept].projectCount += item.projectCount;
          map[capitalDept].financialVolume += item.financialVolume;
        }
      }
    });

    return map;
  }, [geoData]);

  const maxDeptVolume = React.useMemo(() => {
    let maxVal = 1;
    Object.keys(deptDataMap).forEach(dept => {
      const vol = deptDataMap[dept].financialVolume;
      if (vol > maxVal) {
        maxVal = vol;
      }
    });
    return maxVal;
  }, [deptDataMap]);

  const getDeptColor = (deptName: string) => {
    const data = deptDataMap[deptName];
    if (!data || data.financialVolume === 0) {
      return "#F8FAFC"; // off-white
    }
    const ratio = data.financialVolume / maxDeptVolume;
    
    // Siemens/ABB industrial greens scale
    if (ratio > 0.75) return "#064e3b"; // Deep forest green
    if (ratio > 0.50) return "#047857"; // Corporate green
    if (ratio > 0.25) return "#059669"; // Emerald 600
    if (ratio > 0.10) return "#10b981"; // Emerald 500
    return "#a7f3d0"; // Mint green
  };

  // Filter high priority / critical leads
  const getCriticalLeads = () => {
    return filteredLeads
      .filter(l => l.status !== "ganado" && l.status !== "perdido")
      .sort((a, b) => {
        const priorityScore = (l: Lead) => {
          if (l.riskLevel === "HOT") return 3;
          if (l.riskLevel === "WARM") return 2;
          return 1;
        };
        return priorityScore(b) - priorityScore(a);
      })
      .slice(0, 5);
  };

  const criticalLeads = getCriticalLeads();

  // Get active pending tasks (commercial agenda)
  const getPendingTasks = () => {
    return allTasks
      .filter(t => t.status === "pendiente")
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  };

  const pendingTasksList = getPendingTasks();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Buenos días";
    if (hour >= 12 && hour < 19) return "Buenas tardes";
    return "Buenas noches";
  };

  // Actions
  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      showToast("Enlace del Dashboard copiado al portapapeles");
    }
  };

  const handleExportCSV = () => {
    const summaryRows = [
      ["REPORTE EJECUTIVO COMERCIAL - CYH INGENIERÍA"],
      ["Rango Temporal", timeRange.toUpperCase()],
      ["Fecha Generación", new Date().toLocaleString()],
      [],
      ["Métrica", "Valor"],
      ["Total Leads", totalLeads],
      ["Reuniones Agendadas", reunionesAgendadas],
      ["Tasa de Agendamiento", `${agendamientoRate}%`],
      ["Leads Abiertos", abiertos],
      ["Pipeline Total (COP)", formatCOP(pipelineTotal)],
      ["Forecast Probable (COP)", formatCOP(pipelineProbable)],
      [],
      ["DETALLE DE LEADS CRÍTICOS"],
      ["ID Lead", "Contacto", "Empresa", "Ciudad", "Servicio", "Etapa", "Urgencia", "Presupuesto Máximo (COP)"]
    ];

    const leadRows = filteredLeads.map(l => [
      l.id,
      l.fullName,
      l.companyName,
      l.city,
      l.serviceType,
      l.status,
      l.riskLevel,
      l.estimatedBudgetMax || 0
    ]);

    const allRows = [...summaryRows, ...leadRows];
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + allRows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_comercial_cyh_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRefreshData = () => {
    router.refresh();
    showToast("Datos comerciales actualizados en tiempo real");
  };

  // Check role authorization to prevent unauthorized mutations (Simulation of RBAC/network response)
  const isAuthorized = () => {
    return ["admin", "comercial", "director_comercial", "super_admin"].includes(currentUser.role);
  };

  // Dialog 1: Submit Technical Meeting
  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    setModalErrorMessage("");

    if (!isAuthorized()) {
      setModalStatus("error");
      setModalErrorMessage("Acceso Denegado: Su rol de usuario no cuenta con privilegios suficientes para agendar reuniones comerciales.");
      return;
    }

    if (!selectedLead) return;

    // Client-side validations
    const errors: Record<string, string> = {};
    if (!meetingDate) errors.meetingDate = "La fecha es obligatoria.";
    if (!meetingTime) errors.meetingTime = "La hora es obligatoria.";
    if (!meetingSpecialist) errors.meetingSpecialist = "Debe asignar un ingeniero especialista.";
    if (!meetingLocation.trim()) {
      errors.meetingLocation = "El enlace o la dirección física es obligatoria.";
    } else if (meetingLocType === "virtual" && !meetingLocation.startsWith("http")) {
      errors.meetingLocation = "Debe ser una URL válida (Teams/Meet/Zoom).";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    const mDateTimeStr = `${meetingDate}T${meetingTime}:00`;
    const mDateTime = new Date(mDateTimeStr);
    if (mDateTime.getTime() < Date.now()) {
      setValidationErrors({ meetingDate: "La fecha y hora deben ser en el futuro." });
      return;
    }

    setModalStatus("loading");
    setIsPending(true);

    try {
      // 1. Update lead status to "reunion"
      const leadRes = await updateLeadStatusAction(selectedLead.id, "reunion");
      if (!leadRes.success) throw new Error(leadRes.error);

      // 2. Create meeting task
      const taskNotes = `Reunión técnica agendada con el especialista ${meetingSpecialist}. Ubicación/Enlace: ${meetingLocation}. Notas: ${meetingNotes}`;
      const taskRes = await createTaskAction({
        leadId: selectedLead.id,
        taskType: "reunión_técnica",
        dueDate: mDateTimeStr,
        assignedTo: meetingSpecialist,
        notes: taskNotes
      });
      if (!taskRes.success) throw new Error(taskRes.error);

      // 3. Create activity log (Strict schema validation: activityType must be "meeting")
      const logRes = await createActivityLogAction({
        leadId: selectedLead.id,
        activityType: "meeting",
        description: `Se agendó Mesa de Consultoría Técnica con el ingeniero especialista ${meetingSpecialist} para el ${meetingDate} a las ${meetingTime}. Ubicación: ${meetingLocation}.`
      });
      if (!logRes.success) throw new Error(logRes.error);

      setModalStatus("success");
      showToast("Reunión Técnica agendada con éxito. Notificación enviada al ingeniero y al cliente.");
      setTimeout(() => {
        setActiveModal(null);
        setSelectedLead(null);
        setModalStatus("idle");
        setIsPending(false);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setModalStatus("error");
      setModalErrorMessage(err.message || "Error de red o conexión al servidor de base de datos. Intente de nuevo.");
      setIsPending(false);
    }
  };

  // Dialog 2: Quick Contact WhatsApp / Log
  const handleQuickContactLog = async () => {
    setModalErrorMessage("");
    if (!selectedLead) return;

    if (!isAuthorized()) {
      setModalStatus("error");
      setModalErrorMessage("Acceso Denegado: Su rol de usuario no cuenta con privilegios suficientes para registrar interacciones.");
      return;
    }

    setModalStatus("loading");
    setIsPending(true);
    try {
      const outcomeText = callResult === "atendio" ? "Atendió" : 
                          callResult === "no_contesto" ? "No contestó" : "Llamar más tarde";

      // Strict schema compliance: activityType is "call", description registers exact outcome
      const res = await createActivityLogAction({
        leadId: selectedLead.id,
        activityType: "call",
        description: `Llamada comercial. Resultado: ${outcomeText}.`
      });
      
      if (!res.success) throw new Error(res.error);

      setModalStatus("success");
      showToast(`Resultado registrado: ${outcomeText}`);
      setTimeout(() => {
        setActiveModal(null);
        setSelectedLead(null);
        setModalStatus("idle");
        setIsPending(false);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setModalStatus("error");
      setModalErrorMessage(err.message || "Error al guardar el log comercial en la base de datos.");
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

  // Dialog 3: Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    setModalErrorMessage("");

    if (!isAuthorized()) {
      setModalStatus("error");
      setModalErrorMessage("Acceso Denegado: Su rol de usuario no cuenta con privilegios suficientes para crear tareas en la agenda.");
      return;
    }

    // Validations
    const errors: Record<string, string> = {};
    if (!taskTitle.trim()) errors.taskTitle = "El título de la tarea es obligatorio.";
    if (!taskLeadId) errors.taskLeadId = "Debe vincular una empresa o lead.";
    if (!taskDueDate) errors.taskDueDate = "La fecha límite es obligatoria.";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setModalStatus("loading");
    setIsPending(true);
    try {
      const res = await createTaskAction({
        leadId: taskLeadId,
        taskType: "seguimiento",
        dueDate: `${taskDueDate}T18:00:00`,
        assignedTo: currentUser.email,
        notes: taskTitle
      });

      if (!res.success) throw new Error(res.error);

      // Create activity log (Strict schema type "email" or "proposal" or "status_changed")
      await createActivityLogAction({
        leadId: taskLeadId,
        activityType: "proposal",
        description: `Tarea de seguimiento creada: "${taskTitle}" con vencimiento el ${taskDueDate}.`
      });

      setModalStatus("success");
      showToast("Tarea de seguimiento agendada correctamente.");
      setTimeout(() => {
        setActiveModal(null);
        setTaskTitle("");
        setTaskLeadId("");
        setTaskDueDate("");
        setModalStatus("idle");
        setIsPending(false);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setModalStatus("error");
      setModalErrorMessage(err.message || "Error al registrar la tarea en la base de datos.");
      setIsPending(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    if (!isAuthorized()) {
      showToast("Acceso Denegado: Su rol no permite completar tareas.", "error");
      return;
    }
    try {
      const res = await updateTaskStatusAction(taskId, "completado");
      if (res.success) {
        showToast("Tarea completada correctamente");
        router.refresh();
      } else {
        showToast(res.error || "Error al completar la tarea", "error");
      }
    } catch (err: any) {
      showToast("Error de conexión al completar la tarea", "error");
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)] bg-[#F8FAFC] text-slate-900 p-8 font-sans">
      
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
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-xl font-display font-black text-slate-900 uppercase tracking-widest">
            {greeting()}, {currentUser.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Métricas del Centro de Control Operativo · Firma Consultiva · Rol: <span className="text-slate-900 font-bold uppercase">{currentUser.role}</span>
          </p>
        </div>

        {currentUser.role !== 'tecnico' && (
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 border border-slate-200 rounded p-0.5">
              <button 
                onClick={() => setTimeRange("all")}
                className={`px-3 py-1 text-[10px] font-bold uppercase rounded tracking-wider transition-all ${timeRange === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
              >
                Histórico
              </button>
              <button 
                onClick={() => setTimeRange("quarter")}
                className={`px-3 py-1 text-[10px] font-bold uppercase rounded tracking-wider transition-all ${timeRange === "quarter" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
              >
                90 Días
              </button>
              <button 
                onClick={() => setTimeRange("month")}
                className={`px-3 py-1 text-[10px] font-bold uppercase rounded tracking-wider transition-all ${timeRange === "month" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
              >
                30 Días
              </button>
            </div>

            <button 
              onClick={handleRefreshData}
              title="Actualizar Datos"
              className="p-2 border border-slate-200 bg-white text-slate-500 hover:text-slate-900 rounded hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button 
              onClick={handlePrint}
              title="Imprimir Reporte"
              className="p-2 border border-slate-200 bg-white text-slate-500 hover:text-slate-900 rounded hover:bg-slate-50 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button 
              onClick={handleShare}
              title="Compartir Reporte"
              className="p-2 border border-slate-200 bg-white text-slate-500 hover:text-slate-900 rounded hover:bg-slate-50 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded text-[11px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" /> Exportar Reporte
            </button>
          </div>
        )}
      </div>

      {currentUser.role === 'tecnico' || currentUser.role === 'ingeniero' ? (
        <div className="space-y-8">
          {/* Preventa technical KPI cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-slate-100 text-slate-900 rounded">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Diagnósticos Realizados</span>
                <span className="text-2xl font-black text-slate-900">{technicalMetrics?.totalDiagnostics || 0}</span>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pendientes de Revisión</span>
                <span className="text-2xl font-black text-slate-900">{technicalMetrics?.pendingDiagnostics || 0}</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-slate-100 text-slate-900 rounded">
                <LineChart className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tareas Técnicas Pendientes</span>
                <span className="text-2xl font-black text-slate-900">{technicalMetrics?.pendingTasks || 0}</span>
              </div>
            </div>
          </div>

          {/* Recent Technical Diagnostics */}
          <div className="bg-white rounded border border-slate-200 shadow-sm p-6">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-150 pb-3 mb-4">Tus Diagnósticos de Preingeniería Recientes</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                    <th className="p-3">ID Diagnóstico</th>
                    <th className="p-3">Caudal de Aire</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Fecha de Creación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {!technicalMetrics?.diagnosticsList || technicalMetrics.diagnosticsList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400 italic">No tienes diagnósticos técnicos registrados.</td>
                    </tr>
                  ) : (
                    technicalMetrics.diagnosticsList.map((d: any) => (
                      <tr key={d.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-mono font-bold text-slate-900">ID-{d.id.substring(0, 8).toUpperCase()}</td>
                        <td className="p-3 font-semibold">{d.airflow ? `${d.airflow} m³/h` : 'N/A'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            d.status === 'aprobado' || d.status === 'completado' ? 'bg-slate-100 text-slate-800 border border-slate-200' :
                            d.status === 'pendiente' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-red-50 text-red-700 border border-red-200'
                          }`}>{d.status}</span>
                        </td>
                        <td className="p-3 text-slate-500">{new Date(d.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Top KPIs - Siemens/ABB Premium Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Leads Totales</span>
                <Link href="/crm/leads" className="text-[9px] font-bold uppercase text-slate-450 hover:text-slate-900 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 transition-colors flex items-center gap-0.5 select-none">
                  🔍 Ver Detalle
                </Link>
              </div>
              <div className="text-3xl font-display font-black text-slate-900">{totalLeads}</div>
              <span className="text-[10px] text-slate-400 font-medium mt-2 uppercase">Registros del período</span>
            </div>
            
            <div className="bg-white p-6 rounded border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tasa de Agendamiento</span>
                <Link href="/crm/reuniones" className="text-[9px] font-bold uppercase text-slate-455 hover:text-slate-900 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 transition-colors flex items-center gap-0.5 select-none">
                  🔍 Ver Detalle
                </Link>
              </div>
              <div className="text-3xl font-display font-black text-slate-900">{agendamientoRate}%</div>
              <span className="text-[10px] text-slate-400 font-medium mt-2 uppercase">{reunionesAgendadas} agendados / {totalLeads} totales</span>
            </div>

            <div className="bg-white p-6 rounded border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pipeline Total</span>
                <Link href="/crm/pipeline" className="text-[9px] font-bold uppercase text-slate-455 hover:text-slate-900 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 transition-colors flex items-center gap-0.5 select-none">
                  🔍 Ver Detalle
                </Link>
              </div>
              <div className="text-2xl font-display font-black text-slate-900 truncate" title={formatCOP(pipelineTotal)}>
                {formatCOP(pipelineTotal)}
              </div>
              <span className="text-[10px] text-slate-400 font-medium mt-2 uppercase">Valor comercial abierto</span>
            </div>

            <div className="bg-white p-6 rounded border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-450 transition-colors border-l-2 border-l-slate-900">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Forecast Probable</span>
                <Link href="/crm/oportunidades" className="text-[9px] font-bold uppercase text-slate-455 hover:text-slate-900 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 transition-colors flex items-center gap-0.5 select-none">
                  🔍 Ver Detalle
                </Link>
              </div>
              <div className="text-2xl font-display font-black text-slate-900 truncate" title={formatCOP(pipelineProbable)}>
                {formatCOP(pipelineProbable)}
              </div>
              <span className="text-[10px] text-slate-400 font-medium mt-2 uppercase">Ponderado por etapa</span>
            </div>
          </div>

          {/* Gráficos y Embudo */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Gráfico de Conversión Real (Embudo) */}
            <div className="lg:col-span-2 bg-white p-6 rounded border border-slate-200 shadow-sm">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
                <TrendingUp className="w-4 h-4 text-slate-400" /> Embudo de Conversión Comercial
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 w-32">1. Nuevos</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden mx-4">
                    <div className="h-full bg-slate-300 w-full"></div>
                  </div>
                  <span className="text-xs font-bold text-slate-900 w-16 text-right">100% ({stageNuevos})</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 w-32">2. Contacto</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden mx-4">
                    <div className="h-full bg-slate-400" style={{ width: `${pctContacto}%` }}></div>
                  </div>
                  <span className="text-xs font-bold text-slate-900 w-16 text-right">{pctContacto}% ({stageContacto})</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 w-32">3. Reunión</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden mx-4">
                    <div className="h-full bg-slate-600" style={{ width: `${pctReunion}%` }}></div>
                  </div>
                  <span className="text-xs font-bold text-slate-900 w-16 text-right">{pctReunion}% ({stageReunion})</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 w-32">4. Propuesta</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden mx-4">
                    <div className="h-full bg-slate-700" style={{ width: `${pctPropuesta}%` }}></div>
                  </div>
                  <span className="text-xs font-bold text-slate-900 w-16 text-right">{pctPropuesta}% ({stagePropuesta})</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 w-32">5. Ganados</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden mx-4">
                    <div className="h-full bg-slate-900" style={{ width: `${pctGanado}%` }}></div>
                  </div>
                  <span className="text-xs font-bold text-slate-900 w-16 text-right">{pctGanado}% ({stageGanado})</span>
                </div>
              </div>
            </div>

            {/* Distribución Técnica por Tipo de Servicio */}
            <div className="bg-white p-6 rounded border border-slate-200 shadow-sm flex flex-col">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
                <LineChart className="w-4 h-4 text-slate-400" /> Distribución por Solución Industrial
              </h2>
              
              <div className="flex-1 space-y-4">
                {solutionsData().length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 italic">No hay datos de soluciones.</div>
                ) : (
                  solutionsData().map((s, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>{s.label}</span>
                        <span className="text-slate-900">{s.count} ({s.pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-900" style={{ width: `${s.pct}%` }}></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Módulo Geográfico en el Dashboard Comercial */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Columna Izquierda: Mapa de Calor */}
            <div className="lg:col-span-2 bg-white p-6 rounded border border-slate-200 shadow-sm flex flex-col relative">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" /> Distribución Regional de Ventas
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">Mapa de Calor de Colombia</span>
                  <button 
                    onClick={handleReloadGeo} 
                    className="p-1 text-slate-500 hover:text-slate-950 hover:bg-slate-50 border border-slate-200 rounded transition-all"
                    title="Actualizar Datos"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingGeo ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              {loadingGeo ? (
                /* Flat Pulse Skeleton for Map */
                <div className="flex-1 flex flex-col items-center justify-center min-h-[350px] bg-slate-50/50 rounded animate-pulse border border-slate-100">
                  <div className="w-48 h-48 rounded-full bg-slate-200/60 mb-4 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-slate-100"></div>
                  </div>
                  <div className="h-3.5 w-48 bg-slate-200/80 rounded mb-2"></div>
                  <div className="h-2 w-32 bg-slate-200/60 rounded"></div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center relative min-h-[350px]">
                  {/* SVG Heatmap */}
                  <svg viewBox="0 0 620 710" className="w-full h-auto max-h-[350px] select-none">
                    <defs>
                      <pattern id="dot-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1" fill="#cbd5e1" className="opacity-45" />
                      </pattern>
                    </defs>
                    {/* Background Grid Pattern */}
                    <rect width="100%" height="100%" fill="url(#dot-grid)" />
                    
                    <g>
                      {Object.keys(colombiaMapPaths).map((deptName) => {
                        const pathD = colombiaMapPaths[deptName];
                        const fillColor = getDeptColor(deptName);
                        const data = deptDataMap[deptName] || { projectCount: 0, financialVolume: 0 };
                        
                        return (
                          <path 
                            key={deptName}
                            d={pathD}
                            fill={fillColor}
                            stroke="#cbd5e1"
                            strokeWidth="0.8"
                            className="transition-all duration-200 cursor-pointer hover:stroke-slate-650 hover:opacity-95"
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const parentRect = e.currentTarget.ownerDocument.getElementById("map-container")?.getBoundingClientRect();
                              const x = rect.left - (parentRect?.left || 0) + rect.width / 2;
                              const y = rect.top - (parentRect?.top || 0) - 10;
                              setHoveredDept({
                                name: deptName,
                                projectCount: data.projectCount,
                                financialVolume: data.financialVolume,
                                x,
                                y
                              });
                            }}
                            onMouseLeave={() => setHoveredDept(null)}
                          />
                        );
                      })}
                    </g>
                  </svg>

                  {/* Absolute Tooltip Container */}
                  <div id="map-container" className="absolute inset-0 pointer-events-none">
                    {hoveredDept && (
                      <div 
                        className="absolute bg-slate-950/95 border border-emerald-500/45 text-white p-3 rounded shadow-xl text-[10px] w-48 pointer-events-none transition-all duration-200 z-30"
                        style={{ 
                          left: `${hoveredDept.x}px`, 
                          top: `${hoveredDept.y}px`,
                          transform: "translate(-50%, -100%)"
                        }}
                      >
                        <div className="flex items-center justify-between border-b border-emerald-500/30 pb-1.5 mb-1.5">
                          <span className="font-bold uppercase tracking-wider text-emerald-450">{hoveredDept.name}</span>
                          <span className="bg-emerald-950 border border-emerald-800 text-emerald-400 text-[8px] px-1 py-0.5 rounded font-mono font-bold">ACTIVO</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Proyectos:</span>
                            <span className="font-bold font-mono text-white">{hoveredDept.projectCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Volumen:</span>
                            <span className="font-bold font-mono text-emerald-400">{formatCOP(hoveredDept.financialVolume)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Columna Derecha: Top Ciudades */}
            <div className="bg-white p-6 rounded border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-slate-400" /> Top Ciudades Comercial
                  </h2>
                  <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 font-mono font-bold">COTIZADO</span>
                </div>

                {loadingGeo ? (
                  /* Flat Pulse Skeleton for Table */
                  <div className="space-y-3 py-2 animate-pulse">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50">
                        <div className="h-3 w-24 bg-slate-200/80 rounded"></div>
                        <div className="h-3 w-8 bg-slate-200/80 rounded"></div>
                        <div className="h-3 w-16 bg-slate-200/60 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                          <th className="p-2.5">Ciudad</th>
                          <th className="p-2.5 text-center">Proyectos</th>
                          <th className="p-2.5 text-right">Volumen</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {geoData.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="p-6 text-center text-slate-400 italic">No hay registros de ventas geográficas.</td>
                          </tr>
                        ) : (
                          geoData.map((item) => (
                            <tr key={item.city} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-2.5 font-semibold text-slate-900 font-mono">
                                {item.city === "[Por Clasificar]" ? (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                                    ⚠️ Por Clasificar
                                  </span>
                                ) : (
                                  item.city
                                )}
                              </td>
                              <td className="p-2.5 text-center font-mono font-bold text-slate-700">{item.projectCount}</td>
                              <td className="p-2.5 text-right font-mono font-bold text-emerald-600">{formatCOP(item.financialVolume || 0)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Leads Críticos y Agenda Operativa */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tabla de Leads Críticos de Alta Prioridad */}
            <div className="lg:col-span-2 bg-white p-6 rounded border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Leads de Alta Prioridad / Urgencia Crítica
                </h2>
                <span className="text-[10px] text-slate-400 uppercase font-black">Límite: Top 5</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                      <th className="p-3">Empresa</th>
                      <th className="p-3">Ciudad</th>
                      <th className="p-3">Servicio</th>
                      <th className="p-3 text-center">Urgencia</th>
                      <th className="p-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {criticalLeads.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400 italic">No hay leads críticos pendientes de contacto.</td>
                      </tr>
                    ) : (
                      criticalLeads.map((lead: Lead) => (
                        <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 font-semibold text-slate-900">{lead.companyName}</td>
                          <td className="p-3 text-slate-600 font-medium">{lead.city}</td>
                          <td className="p-3 text-slate-500 font-medium capitalize">{lead.serviceType}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              lead.riskLevel === 'HOT' ? 'bg-red-50 text-red-700 border border-red-200' :
                              lead.riskLevel === 'WARM' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>{lead.riskLevel}</span>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => {
                                setSelectedLead(lead);
                                setActiveModal("contact");
                                setModalStatus("idle");
                                setModalErrorMessage("");
                              }}
                              className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-350 rounded transition-colors"
                            >
                              Contactar
                            </button>
                            <button
                              onClick={() => {
                                setSelectedLead(lead);
                                setActiveModal("meeting");
                                setModalStatus("idle");
                                setModalErrorMessage("");
                                setMeetingDate("");
                                setMeetingTime("");
                                setMeetingSpecialist("");
                                setMeetingLocation("");
                                setMeetingNotes("");
                              }}
                              className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors"
                            >
                              Agendar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Panel de Agenda / Próximas Acciones */}
            <div className="bg-white p-6 rounded border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" /> Agenda y Compromisos Técnicos de la Semana
                  </h2>
                  <button 
                    onClick={() => {
                      setActiveModal("task");
                      setModalStatus("idle");
                      setModalErrorMessage("");
                      setTaskTitle("");
                      setTaskLeadId("");
                      setTaskDueDate("");
                    }}
                    className="p-1 text-slate-500 hover:text-slate-950 hover:bg-slate-50 border border-slate-200 rounded transition-all"
                    title="Nueva Tarea"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {pendingTasksList.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-400 italic">No hay tareas o reuniones pendientes de seguimiento.</div>
                  ) : (
                    pendingTasksList.map((task: CrmTask) => {
                      const linkedLead = allLeads.find(l => l.id === task.leadId);
                      return (
                        <div key={task.id} className="p-3 border border-slate-100 rounded-md hover:border-slate-250 transition-colors flex items-start justify-between gap-3 bg-slate-50/50">
                          <div className="space-y-1">
                            <span className="block text-xs font-bold text-slate-900 leading-snug">{task.notes || task.taskType}</span>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-500 font-medium">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /> {new Date(task.dueDate).toLocaleDateString()}</span>
                              {linkedLead && <span className="text-slate-900">· {linkedLead.companyName}</span>}
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                task.priority === 'alta' ? 'bg-red-50 text-red-700' :
                                task.priority === 'media' ? 'bg-slate-100 text-slate-800' :
                                'bg-slate-50 text-slate-500'
                              }`}>{task.priority}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleCompleteTask(task.id)}
                            disabled={isPending}
                            className="p-1 border border-slate-200 bg-white text-slate-400 hover:text-slate-950 hover:bg-slate-50 rounded shadow-xs transition-colors disabled:opacity-55"
                            title="Completar tarea"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- MODAL 1: AGENDAR REUNIÓN TÉCNICA (SIEMENS / ABB PREMIUM STYLE) --- */}
      {activeModal === "meeting" && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-all duration-300">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 shadow-2xl rounded p-8 flex flex-col gap-6 animate-scale-up">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                  Mesa de Consultoría Técnica
                </h3>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mt-1">
                  Forzar Conversión de Lead
                </p>
              </div>
              <button 
                onClick={() => { setActiveModal(null); setSelectedLead(null); }}
                className="p-1 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Read-Only Lead Summary */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded text-xs space-y-2">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ficha Lead (Solo Lectura)</span>
              <div className="grid grid-cols-2 gap-3 font-semibold text-slate-800">
                <div>Empresa: <span className="text-slate-900 font-bold">{selectedLead.companyName}</span></div>
                <div>Ciudad: <span className="text-slate-900 font-bold">{selectedLead.city}</span></div>
                <div>Servicio Wizard: <span className="text-slate-900 font-bold capitalize">{selectedLead.serviceType}</span></div>
                <div>Puntaje Lead: <span className="text-slate-900 font-bold">{selectedLead.leadScore} pts</span></div>
              </div>
            </div>

            {/* Error Message Box */}
            {modalErrorMessage && (
              <div className="p-4 bg-red-50 border border-red-100 rounded text-xs text-red-900 font-medium flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{modalErrorMessage}</span>
              </div>
            )}

            {/* Form */}
            {modalStatus === "success" ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <Check className="w-6 h-6 text-accent-cyan" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Reunión Agendada</h4>
                <p className="text-xs text-slate-500">Notificación enviada al ingeniero y al cliente.</p>
              </div>
            ) : (
              <form onSubmit={handleScheduleMeeting} className="space-y-4 text-xs font-semibold">
                
                {/* Date / Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 uppercase tracking-wider block">Fecha de Reunión</label>
                    <input 
                      type="date"
                      value={meetingDate}
                      onChange={(e) => setMeetingDate(e.target.value)}
                      className={`w-full p-2.5 border rounded bg-white text-slate-900 font-medium focus:outline-none focus:border-slate-500 ${validationErrors.meetingDate ? "border-red-500" : "border-slate-200"}`}
                    />
                    {validationErrors.meetingDate && <span className="text-[10px] text-red-500 block font-bold">{validationErrors.meetingDate}</span>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 uppercase tracking-wider block">Hora de Reunión</label>
                    <input 
                      type="time"
                      value={meetingTime}
                      onChange={(e) => setMeetingTime(e.target.value)}
                      className={`w-full p-2.5 border rounded bg-white text-slate-900 font-medium focus:outline-none focus:border-slate-500 ${validationErrors.meetingTime ? "border-red-500" : "border-slate-200"}`}
                    />
                    {validationErrors.meetingTime && <span className="text-[10px] text-red-500 block font-bold">{validationErrors.meetingTime}</span>}
                  </div>
                </div>

                {/* Assigned Specialist */}
                <div className="space-y-1.5">
                  <label className="text-slate-500 uppercase tracking-wider block">Ingeniero Especialista Asignado</label>
                  <select
                    value={meetingSpecialist}
                    onChange={(e) => setMeetingSpecialist(e.target.value)}
                    className={`w-full p-2.5 border rounded bg-white text-slate-900 font-medium focus:outline-none focus:border-slate-500 ${validationErrors.meetingSpecialist ? "border-red-500" : "border-slate-200"}`}
                  >
                    <option value="">Seleccione un ingeniero técnico...</option>
                    {allUsers.filter(u => ["ingeniero", "tecnico", "admin"].includes(u.role)).map(u => (
                      <option key={u.id} value={u.email}>{u.fullName || u.email} ({u.role.toUpperCase()})</option>
                    ))}
                  </select>
                  {validationErrors.meetingSpecialist && <span className="text-[10px] text-red-500 block font-bold">{validationErrors.meetingSpecialist}</span>}
                </div>

                {/* Modality Selector */}
                <div className="space-y-1.5">
                  <label className="text-slate-500 uppercase tracking-wider block">Modalidad de Reunión</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                      <input 
                        type="radio" 
                        name="meetingLocType" 
                        checked={meetingLocType === "virtual"}
                        onChange={() => { setMeetingLocType("virtual"); setMeetingLocation(""); }}
                        className="text-slate-900 focus:ring-0" 
                      />
                      Videoconferencia (Teams/Meet)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                      <input 
                        type="radio" 
                        name="meetingLocType" 
                        checked={meetingLocType === "physical"}
                        onChange={() => { setMeetingLocType("physical"); setMeetingLocation(""); }}
                        className="text-slate-900 focus:ring-0" 
                      />
                      Visita Técnica Física en Planta
                    </label>
                  </div>
                </div>

                {/* Location Input (URL / Address) */}
                <div className="space-y-1.5">
                  <label className="text-slate-500 uppercase tracking-wider block">
                    {meetingLocType === "virtual" ? "Enlace de la Reunión (URL)" : "Dirección Física de la Planta"}
                  </label>
                  <input 
                    type="text"
                    value={meetingLocation}
                    onChange={(e) => setMeetingLocation(e.target.value)}
                    placeholder={meetingLocType === "virtual" ? "https://teams.microsoft.com/l/meetup-join/..." : "Carrera 45 # 23-45, Zona Industrial, Barranquilla"}
                    className={`w-full p-2.5 border rounded bg-white text-slate-900 font-medium focus:outline-none focus:border-slate-500 ${validationErrors.meetingLocation ? "border-red-500" : "border-slate-200"}`}
                  />
                  {validationErrors.meetingLocation && <span className="text-[10px] text-red-500 block font-bold">{validationErrors.meetingLocation}</span>}
                </div>

                {/* Prep Notes */}
                <div className="space-y-1.5">
                  <label className="text-slate-500 uppercase tracking-wider block">Notas de preparación de preingeniería</label>
                  <textarea 
                    value={meetingNotes}
                    onChange={(e) => setMeetingNotes(e.target.value)}
                    placeholder="Detalles sobre el caudal preliminar, planos requeridos de ductos o problemas de temperatura reportados."
                    rows={3}
                    className="w-full p-2.5 border border-slate-200 rounded bg-white text-slate-900 font-medium focus:outline-none focus:border-slate-500"
                  />
                </div>

                {/* Submit Actions */}
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => { setActiveModal(null); setSelectedLead(null); }}
                    className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded hover:bg-slate-50 font-bold uppercase tracking-wider text-[10px]"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={isPending}
                    className="px-6 py-2.5 bg-slate-900 text-white rounded hover:bg-slate-800 disabled:bg-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-2"
                  >
                    {modalStatus === "loading" ? "Procesando..." : "Confirmar Reunión"}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

      {/* --- MODAL 2: VENTANA QUICK-ACTION: DETALLE Y CONTACTO RÁPIDO (SIEMENS / ABB PREMIUM STYLE) --- */}
      {activeModal === "contact" && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-all duration-300">
          <div className="relative w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded p-8 flex flex-col gap-6 animate-scale-up">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                  Contacto Comercial Rápido
                </h3>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mt-1">
                  Contacto inmediato en menos de 5 min (Urgente)
                </p>
              </div>
              <button 
                onClick={() => { setActiveModal(null); setSelectedLead(null); }}
                className="p-1 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message Box */}
            {modalErrorMessage && (
              <div className="p-4 bg-red-50 border border-red-100 rounded text-xs text-red-900 font-medium flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{modalErrorMessage}</span>
              </div>
            )}

            {/* Ficha Ejecutiva Lead */}
            <div className="space-y-4 text-xs font-semibold">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-1">Ficha Ejecutiva del Lead</span>
              
              <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-slate-800">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Contacto</span>
                  <span className="text-slate-900 font-bold">{selectedLead.fullName}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Cargo</span>
                  <span className="text-slate-900 font-bold">{selectedLead.cargo || "Ingeniero Planta"}</span>
                </div>
                <div className="space-y-1 col-span-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Empresa</span>
                  <span className="text-slate-900 font-bold">{selectedLead.companyName}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Teléfono</span>
                  <span className="text-slate-900 font-bold flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedLead.phone}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Correo</span>
                  <span className="text-slate-900 font-bold block truncate">{selectedLead.email}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Urgencia</span>
                  <span className="text-slate-900 font-bold uppercase tracking-wide flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${selectedLead.riskLevel === 'HOT' ? 'bg-red-500' : 'bg-amber-400'}`}></span>
                    {selectedLead.riskLevel} (Urgencia: {selectedLead.urgencyLevel})
                  </span>
                </div>
              </div>

              {/* Botón directo WhatsApp con Mensaje Platilla */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleWhatsAppTrigger}
                  className="w-full py-3 border border-slate-350 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold uppercase tracking-wider text-[10px] rounded flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir WhatsApp con Plantilla Técnica
                </button>
              </div>

              {/* Selector de Resultado de Llamada */}
              {modalStatus === "success" ? (
                <div className="py-4 text-center space-y-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block text-emerald-600">✓ Log registrado en la línea de tiempo</span>
                </div>
              ) : (
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <label className="text-slate-500 uppercase tracking-wider block">Registrar Resultado de Llamada</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setCallResult("atendio")}
                      className={`py-2 px-1 border text-[10px] font-bold uppercase tracking-wider rounded ${callResult === "atendio" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}
                    >
                      Atendió
                    </button>
                    <button
                      type="button"
                      onClick={() => setCallResult("no_contesto")}
                      className={`py-2 px-1 border text-[10px] font-bold uppercase tracking-wider rounded ${callResult === "no_contesto" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}
                    >
                      No Contestó
                    </button>
                    <button
                      type="button"
                      onClick={() => setCallResult("llamar_mas_tarde")}
                      className={`py-2 px-1 border text-[10px] font-bold uppercase tracking-wider rounded ${callResult === "llamar_mas_tarde" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}
                    >
                      Llamar Luego
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => { setActiveModal(null); setSelectedLead(null); }}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded hover:bg-slate-50 font-bold uppercase tracking-wider text-[10px]"
                >
                  Cerrar
                </button>
                <button 
                  type="button" 
                  disabled={isPending}
                  onClick={handleQuickContactLog}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded hover:bg-slate-800 disabled:bg-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-2"
                >
                  {modalStatus === "loading" ? "Procesando..." : "Guardar Interacción"}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* --- MODAL 3: CREAR NUEVA TAREA / RECORDATORIO (SIEMENS / ABB PREMIUM STYLE) --- */}
      {activeModal === "task" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-all duration-300">
          <div className="relative w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded p-8 flex flex-col gap-6 animate-scale-up">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                  Crear Nueva Tarea
                </h3>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mt-1">
                  Asegurar Seguimiento Riguroso a Clientes
                </p>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-1 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message Box */}
            {modalErrorMessage && (
              <div className="p-4 bg-red-50 border border-red-100 rounded text-xs text-red-900 font-medium flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{modalErrorMessage}</span>
              </div>
            )}

            {/* Form */}
            {modalStatus === "success" ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <Check className="w-6 h-6 text-accent-cyan" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Tarea Registrada</h4>
                <p className="text-xs text-slate-500">Agregada a su agenda y calendario.</p>
              </div>
            ) : (
              <form onSubmit={handleCreateTask} className="space-y-4 text-xs font-semibold">
                
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-slate-500 uppercase tracking-wider block">Título de la acción</label>
                  <input 
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder='ej: "Validar recepción de PDF de preingeniería con Gerencia"'
                    className={`w-full p-2.5 border rounded bg-white text-slate-900 font-medium focus:outline-none focus:border-slate-500 ${validationErrors.taskTitle ? "border-red-500" : "border-slate-200"}`}
                  />
                  {validationErrors.taskTitle && <span className="text-[10px] text-red-500 block font-bold">{validationErrors.taskTitle}</span>}
                </div>

                {/* Linked Lead / Company */}
                <div className="space-y-1.5">
                  <label className="text-slate-500 uppercase tracking-wider block">Lead/Empresa Vinculada</label>
                  <select
                    value={taskLeadId}
                    onChange={(e) => setTaskLeadId(e.target.value)}
                    className={`w-full p-2.5 border rounded bg-white text-slate-900 font-medium focus:outline-none focus:border-slate-500 ${validationErrors.taskLeadId ? "border-red-500" : "border-slate-200"}`}
                  >
                    <option value="">Seleccione una empresa...</option>
                    {allLeads.map(l => (
                      <option key={l.id} value={l.id}>{l.companyName} ({l.fullName})</option>
                    ))}
                  </select>
                  {validationErrors.taskLeadId && <span className="text-[10px] text-red-500 block font-bold">{validationErrors.taskLeadId}</span>}
                </div>

                {/* Due Date & Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 uppercase tracking-wider block">Fecha límite</label>
                    <input 
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className={`w-full p-2.5 border rounded bg-white text-slate-900 font-medium focus:outline-none focus:border-slate-500 ${validationErrors.taskDueDate ? "border-red-500" : "border-slate-200"}`}
                    />
                    {validationErrors.taskDueDate && <span className="text-[10px] text-red-500 block font-bold">{validationErrors.taskDueDate}</span>}
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-slate-500 uppercase tracking-wider block">Prioridad</label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded bg-white text-slate-900 font-medium focus:outline-none focus:border-slate-500"
                    >
                      <option value="alta">ALTA</option>
                      <option value="media">MEDIA</option>
                      <option value="baja">BAJA</option>
                    </select>
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded hover:bg-slate-50 font-bold uppercase tracking-wider text-[10px]"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={isPending}
                    className="px-6 py-2.5 bg-slate-900 text-white rounded hover:bg-slate-800 disabled:bg-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-2"
                  >
                    {modalStatus === "loading" ? "Procesando..." : "Crear Tarea"}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
