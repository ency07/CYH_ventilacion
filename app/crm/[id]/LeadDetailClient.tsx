"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  Clock, 
  CheckCircle2, 
  Circle, 
  FileText, 
  UploadCloud, 
  Download, 
  Image as ImageIcon, 
  X, 
  Plus, 
  Edit2, 
  Shield, 
  AlertCircle, 
  Check 
} from "lucide-react";
import { leads, crmTasks, crmActivityLogs, diagnosticReports, crmOpportunities, crmPipeline, crmUsers, crmProposals, crmDocuments } from "@/lib/db/schema";
import { createActivityLogAction, createTaskAction, updateCommercialDataAction } from "@/lib/server-actions/crm";
import { upsertDiagnosticAction } from "@/lib/server-actions/diagnostics";

type LeadSelect = typeof leads.$inferSelect;
type TaskSelect = typeof crmTasks.$inferSelect;
type ActivityLogSelect = typeof crmActivityLogs.$inferSelect;
type DiagnosticReportSelect = typeof diagnosticReports.$inferSelect;
type OpportunitySelect = typeof crmOpportunities.$inferSelect;
type PipelineSelect = typeof crmPipeline.$inferSelect;
type CrmUserSelect = typeof crmUsers.$inferSelect;
type ProposalSelect = typeof crmProposals.$inferSelect;
type DocumentSelect = typeof crmDocuments.$inferSelect;

export type LeadDetailData = LeadSelect & {
  crmTasks: TaskSelect[];
  crmActivityLogs: ActivityLogSelect[];
  diagnosticReports: DiagnosticReportSelect[];
  crmOpportunities: OpportunitySelect[];
  crmPipelines: PipelineSelect[];
  crmProposals: ProposalSelect[];
  crmDocuments: DocumentSelect[];
};

interface LeadDetailClientProps {
  lead: LeadDetailData;
  currentUser: { id: string; name: string; role: string; email: string };
  allCrmUsers: CrmUserSelect[];
}

export default function LeadDetailClient({ lead, currentUser, allCrmUsers }: LeadDetailClientProps) {
  const router = useRouter();
  
  // Modal states
  const [isActivityModalOpen, setActivityModalOpen] = useState(false);
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [savingActivity, setSavingActivity] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Diagnostic (Preingenieria) Edit States
  const [isDiagEditMode, setDiagEditMode] = useState(false);
  const [savingDiag, setSavingDiag] = useState(false);

  // Toast notifications
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

  const tasks = lead.crmTasks || [];
  const activities = lead.crmActivityLogs || [];
  const diagnostic = lead.diagnosticReports?.[0] || null;
  const pipeline = lead.crmPipelines?.[0] || null;
  const opportunity = lead.crmOpportunities?.[0] || null;
  const assignedTo = pipeline?.assignedTo;

  // Sort activities newest first
  const sortedActivities = [...activities].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  // Sort tasks pending first, then by date
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status === 'pendiente' && b.status === 'completado') return -1;
    if (a.status === 'completado' && b.status === 'pendiente') return 1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

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

  const handleCreateActivity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingActivity(true);
    setErrorMsg("");
    const formData = new FormData(e.currentTarget);
    const data = {
      leadId: lead.id,
      activityType: formData.get("activityType") as string,
      description: formData.get("description") as string,
    };
    
    try {
      const res = await createActivityLogAction(data);
      if (res.success) {
        setActivityModalOpen(false);
        showToast("Actividad comercial registrada.");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Error al registrar actividad.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error al procesar la solicitud.");
    } finally {
      setSavingActivity(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingTask(true);
    setErrorMsg("");
    const formData = new FormData(e.currentTarget);
    
    const date = formData.get("dueDate") as string;
    const time = formData.get("dueTime") as string;
    const combinedDateTime = `${date}T${time}:00`;

    const data = {
      leadId: lead.id,
      taskType: formData.get("taskType") as string,
      dueDate: combinedDateTime,
      notes: formData.get("notes") as string,
      assignedTo: formData.get("assignedTo") as string || assignedTo || "",
    };

    try {
      const res = await createTaskAction(data);
      if (res.success) {
        setTaskModalOpen(false);
        showToast("Tarea programada exitosamente.");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Error al programar tarea.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error al procesar la solicitud.");
    } finally {
      setSavingTask(false);
    }
  };

  const handleSaveDiagnostic = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingDiag(true);
    const formData = new FormData(e.currentTarget);

    try {
      const payload = {
        leadId: lead.id,
        airflow: formData.get("airflow") ? Number(formData.get("airflow")) : null,
        dimensions: {
          width: formData.get("width") ? Number(formData.get("width")) : 0,
          length: formData.get("length") ? Number(formData.get("length")) : 0,
          height: formData.get("height") ? Number(formData.get("height")) : 0,
        },
        technicalObservations: formData.get("technicalObservations") as string,
        recommendations: formData.get("recommendations") as string,
        materialSuggestions: formData.get("materialSuggestions") as string,
        status: formData.get("status") as string,
        verdictNotes: formData.get("verdictNotes") as string,
      };

      const res = await upsertDiagnosticAction(payload);
      if (res.success) {
        setDiagEditMode(false);
        showToast("Diagnóstico técnico actualizado exitosamente.");
        router.refresh();
      } else {
        showToast(res.error || "Error al actualizar diagnóstico.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Error al guardar el diagnóstico.", "error");
    } finally {
      setSavingDiag(false);
    }
  };

  const handleReassign = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAssignee = e.target.value;
    const probability = pipeline?.probability || 10;
    const nextMeeting = pipeline?.nextMeeting ? pipeline.nextMeeting.toISOString() : null;
    const nextTask = pipeline?.nextTask || null;

    try {
      const res = await updateCommercialDataAction(lead.id, newAssignee, probability, nextMeeting, nextTask);
      if (res.success) {
        showToast("Asesor reasignado correctamente.");
        router.refresh();
      } else {
        showToast(res.error || "Error al reassignar asesor.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Error de comunicación en reasignación.", "error");
    }
  };

  let parsedDims = null;
  if (diagnostic?.dimensions) {
    try {
      parsedDims = typeof diagnostic.dimensions === 'string' 
        ? JSON.parse(diagnostic.dimensions) 
        : (diagnostic.dimensions as any);
    } catch (e) {
      parsedDims = null;
    }
  }

  const isTechnicalUser = currentUser.role === "tecnico" || currentUser.role === "ingeniero";

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-4rem)] bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
      
      {/* Toast Alert */}
      {toast.show && (
        <div className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded shadow-lg border text-sm font-semibold transition-all duration-300 animate-slide-up ${
          toast.type === "success" 
            ? "bg-slate-900 text-white border-slate-800" 
            : "bg-red-50 text-red-900 border-red-200"
        }`}>
          {toast.type === "success" ? <Check className="w-4 h-4 text-emerald-450" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* PANEL IZQUIERDO: DETALLE DEL LEAD */}
      <aside className="w-full lg:w-80 border-r border-slate-200 bg-white flex flex-col p-6 space-y-5 shrink-0 overflow-y-auto">
        <Link href="/crm/pipeline" className="text-xs text-slate-500 hover:text-slate-950 flex items-center gap-1.5 w-fit font-bold uppercase tracking-wider transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver al Pipeline
        </Link>
        
        <div>
          <div className="flex items-start gap-3 mb-2">
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-md shrink-0">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-950 uppercase leading-snug line-clamp-3">{lead.companyName}</h1>
              <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 text-slate-400" /> {lead.city}
              </p>
            </div>
          </div>
          
          <div className="mt-4 flex gap-1.5">
            <span className={`text-[9px] px-2 py-0.75 rounded font-black uppercase tracking-wider border ${
              lead.riskLevel === "HOT" ? "bg-red-50 text-red-700 border-red-200" :
              lead.riskLevel === "WARM" ? "bg-amber-50 text-amber-700 border-amber-200" :
              "bg-slate-100 text-slate-655 border-slate-200"
            }`}>
              {lead.riskLevel}
            </span>
            <span className="text-[9px] px-2 py-0.75 bg-slate-100 border border-slate-200 rounded font-black uppercase text-slate-700 tracking-wider">
              SCORE: {lead.leadScore}
            </span>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div>
            <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Contacto Principal</h3>
            <p className="text-xs font-bold text-slate-900">{lead.fullName}</p>
            <p className="text-xs text-slate-550 mt-0.5">
              {lead.cargo ? (
                lead.cargo
              ) : (
                <span className="inline-block text-[9px] px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-bold uppercase tracking-wider">
                  Sin registrar
                </span>
              )}
            </p>
          </div>
          
          <div className="space-y-2 text-xs">
            <p className="text-slate-600 flex items-center gap-2 font-medium">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" /> {lead.email}
            </p>
            <p className="text-slate-600 flex items-center gap-2 font-medium">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" /> {lead.phone}
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Detalles Comerciales</h3>
          <div className="bg-slate-50 p-3.5 rounded border border-slate-200/60 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-semibold">Estado Lead:</span>
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">{lead.status.replace("_", " ")}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-semibold">Servicio:</span>
              <span className="font-bold text-slate-800 capitalize">{displayServiceName(lead.serviceType)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-semibold">Valor Máx:</span>
              {isTechnicalUser ? (
                <span className="font-mono text-[9px] font-bold text-red-650 bg-red-50 border border-red-200 rounded px-1.5 py-0.5 select-none uppercase tracking-wider">
                  [Confidencial]
                </span>
              ) : (
                <span className="font-black text-slate-900">
                  {lead.estimatedBudgetMax 
                    ? `$${Math.round(lead.estimatedBudgetMax).toLocaleString()} COP` 
                    : <span className="text-slate-400 italic">No asignado</span>
                  }
                </span>
              )}
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-semibold">Asesor:</span>
              {["admin", "director_comercial"].includes(currentUser.role) ? (
                <select
                  value={assignedTo || ""}
                  onChange={handleReassign}
                  className="bg-white border border-slate-200 text-xs text-slate-800 rounded px-1.5 py-0.5 focus:outline-none focus:border-slate-400 cursor-pointer font-bold"
                >
                  <option value="">Sin asignar</option>
                  {allCrmUsers.filter(u => ["admin", "comercial", "director_comercial"].includes(u.role)).map(u => (
                    <option key={u.id} value={u.email}>{u.fullName || u.email}</option>
                  ))}
                </select>
              ) : (
                <span className="font-bold text-slate-800 truncate max-w-[120px]">
                  {assignedTo || "Sin asignar"}
                </span>
              )}
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-semibold">Fecha Registro:</span>
              <span className="font-medium text-slate-650">{new Date(lead.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {lead.notes && (
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Requerimiento Inicial</h3>
            <div className="bg-slate-50 p-3.5 rounded border border-slate-200/60 text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
              {lead.notes}
            </div>
          </div>
        )}
      </aside>

      {/* PANEL CENTRAL: TAREAS, ACTIVIDADES, PREINGENIERÍA */}
      <main className="flex-1 p-6 space-y-6 overflow-y-auto h-[calc(100vh-4rem)]">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
          <h2 className="text-lg font-black uppercase tracking-widest text-slate-900">Seguimiento 360° Lead</h2>
          <span className="text-xs font-semibold text-slate-500">CYH OS v3.2</span>
        </div>

        {/* GRUPO DE TAREAS Y TIMELINE */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* GESTOR DE TAREAS */}
          <section className="bg-white border border-slate-200 rounded shadow-xs p-5 flex flex-col h-[480px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4.5 h-4.5 text-slate-700" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">Tareas Comerciales</h3>
              </div>
              <button 
                onClick={() => setTaskModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 text-white rounded text-[10px] font-bold uppercase hover:bg-slate-800 transition-colors shadow-xs"
              >
                <Plus className="w-3 h-3" /> Programar Tarea
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
              {sortedTasks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center border border-dashed border-slate-200 rounded p-6 bg-slate-50/50 text-center">
                  <CheckCircle2 className="w-8 h-8 text-slate-300 mb-3 animate-pulse" />
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Sin Tareas Programadas</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] leading-normal font-semibold">
                    No hay acciones de seguimiento pendientes para este lead.
                  </p>
                  <button 
                    onClick={() => setTaskModalOpen(true)}
                    className="mt-4 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm"
                  >
                    Programar Primera Tarea
                  </button>
                </div>
              ) : (
                sortedTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className={`flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200/60 rounded transition-colors ${
                      task.status === 'completado' ? 'opacity-60' : 'hover:border-slate-400'
                    }`}
                  >
                    {task.status === 'completado' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-bold ${task.status === 'completado' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                        {task.taskType}
                      </h4>
                      {task.notes && <p className="text-[10px] text-slate-500 mt-1 leading-relaxed font-semibold">{task.notes}</p>}
                      <div className="flex items-center gap-3 mt-2 text-[9px] font-bold text-slate-450 uppercase tracking-wider">
                        <span className="flex items-center gap-1 text-slate-900 bg-slate-200/50 px-1.5 py-0.5 rounded">
                          <Clock className="w-3 h-3 text-slate-500" /> {new Date(task.dueDate).toLocaleString()}
                        </span>
                        <span>Asignado: {task.assignedTo?.split("@")[0] || "Asesor"}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* TIMELINE DE ACTIVIDAD */}
          <section className="bg-white border border-slate-200 rounded shadow-xs p-5 flex flex-col h-[480px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-slate-700" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">Actividad Comercial</h3>
              </div>
              <button 
                onClick={() => setActivityModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded text-[10px] font-bold uppercase hover:bg-slate-50 transition-colors shadow-xs"
              >
                <Plus className="w-3 h-3" /> Registrar Actividad
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 relative pl-2 scrollbar-thin scrollbar-thumb-slate-200">
              <div className="absolute left-[13px] top-2 bottom-0 w-px bg-slate-200"></div>
              
              {sortedActivities.length === 0 ? (
                <div className="relative pl-6 pb-6 pt-2">
                  <div className="absolute left-[8px] top-3.5 w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-white ring-2 ring-slate-100"></div>
                  <h4 className="text-xs font-bold text-slate-950">Lead Creado en CYH OS</h4>
                  <p className="text-[9px] font-mono text-slate-400 mt-0.5">{new Date(lead.createdAt).toLocaleString()}</p>
                </div>
              ) : (
                sortedActivities.map((act, idx) => (
                  <div key={act.id} className="relative pl-6 pb-5">
                    <div className={`absolute left-[8px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ring-2 ring-slate-100 ${
                      idx === 0 ? 'bg-slate-900 ring-slate-200' : 'bg-slate-350'
                    }`}></div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
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
                    </h4>
                    <p className="text-[9px] font-mono text-slate-400 mt-0.5">{new Date(act.createdAt).toLocaleString()}</p>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed font-semibold">{act.description}</p>
                    
                    {act.activityType === 'report_generated' && (
                      <div className="mt-2 flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded w-fit">
                        <FileText className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="text-[9px] font-bold text-slate-750 uppercase">Ficha_Tecnica.pdf</span>
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Keep Lead Creado at the very bottom */}
              {sortedActivities.length > 0 && (
                <div className="relative pl-6">
                  <div className="absolute left-[8px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white"></div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Lead Creado en CYH OS</h4>
                  <p className="text-[9px] font-mono text-slate-400 mt-0.5">{new Date(lead.createdAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* TECHNICAL PREINGENIERIA & FINANCIAL OPP */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* PREINGENIERÍA Y VERDICTO TÉCNICO */}
          <section className="bg-white border border-slate-200 rounded shadow-xs p-5 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-slate-700" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">Preingeniería y Veredicto Técnico</h3>
              </div>
              {!isDiagEditMode && !isTechnicalUser && (
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 border border-slate-200 rounded px-2 py-0.5">
                  Solo Lectura
                </span>
              )}
              {!isDiagEditMode && (currentUser.role === "admin" || isTechnicalUser) && (
                <button 
                  onClick={() => setDiagEditMode(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded text-[10px] font-bold uppercase hover:bg-slate-50 transition-colors shadow-xs"
                >
                  <Edit2 className="w-3 h-3" /> Editar
                </button>
              )}
            </div>

            {isDiagEditMode ? (
              /* FORMULARIO DE EDICIÓN */
              <form onSubmit={handleSaveDiagnostic} className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Caudal CFM *</label>
                    <input 
                      required 
                      name="airflow" 
                      type="number" 
                      defaultValue={diagnostic?.airflow || ""} 
                      placeholder="Ej: 1500" 
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-400" 
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Ancho (m)</label>
                      <input 
                        name="width" 
                        type="number" 
                        step="0.1" 
                        defaultValue={parsedDims?.width || 0} 
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-2 text-sm text-center focus:outline-none focus:border-slate-400" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Largo (m)</label>
                      <input 
                        name="length" 
                        type="number" 
                        step="0.1" 
                        defaultValue={parsedDims?.length || 0} 
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-2 text-sm text-center focus:outline-none focus:border-slate-400" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Alto (m)</label>
                      <input 
                        name="height" 
                        type="number" 
                        step="0.1" 
                        defaultValue={parsedDims?.height || 0} 
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-2 text-sm text-center focus:outline-none focus:border-slate-400" 
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Observaciones Técnicas *</label>
                  <textarea 
                    required 
                    name="technicalObservations" 
                    rows={2} 
                    defaultValue={diagnostic?.technicalObservations || ""} 
                    placeholder="Detalles sobre temperatura, ventilación, extrusión, etc." 
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                  ></textarea>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Recomendaciones Técnicas</label>
                  <textarea 
                    name="recommendations" 
                    rows={2} 
                    defaultValue={diagnostic?.recommendations || ""} 
                    placeholder="Equipos recomendados, cantidad de extractores..." 
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                  ></textarea>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Sugerencia de Materiales</label>
                  <textarea 
                    name="materialSuggestions" 
                    rows={2} 
                    defaultValue={diagnostic?.materialSuggestions || ""} 
                    placeholder="Filtros, ductos de lámina galvanizada, etc." 
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Veredicto Técnico *</label>
                    <select 
                      name="status" 
                      defaultValue={diagnostic?.status || "pendiente"} 
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-400 cursor-pointer font-bold"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="aprobado">Aprobado / Viable</option>
                      <option value="requiere_visita">Requiere Visita en Planta</option>
                      <option value="rechazado">Rechazado / Inviable</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Notas del Veredicto</label>
                    <input 
                      name="verdictNotes" 
                      type="text" 
                      defaultValue={diagnostic?.verdictNotes || ""} 
                      placeholder="Ej: Viabilidad alta usando extractor axiales." 
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-400" 
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2 justify-end">
                  <button 
                    type="button" 
                    onClick={() => setDiagEditMode(false)}
                    className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded text-[11px] font-bold uppercase tracking-wider"
                  >
                    Cancelar
                  </button>
                  <button 
                    disabled={savingDiag} 
                    type="submit" 
                    className="px-5 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                  >
                    {savingDiag ? "Guardando..." : "Guardar Diagnóstico"}
                  </button>
                </div>
              </form>
            ) : (
              /* MODO VISUALIZACIÓN: ABB SLATE TEXTURED */
              <div className="space-y-4 text-xs font-mono">
                <div className="grid grid-cols-2 gap-4">
                  {/* CFM Box - ABB Slate */}
                  <div className="bg-[#EDF1F3] border border-slate-300 rounded p-4 shadow-inner">
                    <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5">TELEMETRÍA CAUDAL (CFM)</span>
                    <span className="text-base font-black text-slate-950">
                      {diagnostic?.airflow ? `${diagnostic.airflow} CFM` : 'N/A REGISTRADO'}
                    </span>
                  </div>

                  {/* Dimensions Box - ABB Slate */}
                  <div className="bg-[#EDF1F3] border border-slate-300 rounded p-4 shadow-inner">
                    <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5">DIMENSIONES INDUSTRIALES NAVE</span>
                    <span className="text-xs font-black text-slate-950 block mt-1">
                      {parsedDims ? `${parsedDims.width || 0}m × ${parsedDims.length || 0}m × ${parsedDims.height || 0}m` : 'N/A REGISTRADAS'}
                    </span>
                  </div>
                </div>
                
                <div className="bg-slate-100/50 border border-slate-200 rounded p-3.5 space-y-3 font-semibold text-slate-700 font-sans">
                  {diagnostic?.technicalObservations && (
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Observaciones Técnicas:</span>
                      <p className="text-slate-900 leading-relaxed whitespace-pre-wrap text-[11px] bg-white border border-slate-200/50 p-2.5 rounded shadow-xs">{diagnostic.technicalObservations}</p>
                    </div>
                  )}

                  {diagnostic?.recommendations && (
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Recomendaciones de Preingeniería:</span>
                      <p className="text-slate-900 leading-relaxed whitespace-pre-wrap text-[11px] bg-white border border-slate-200/50 p-2.5 rounded shadow-xs">{diagnostic.recommendations}</p>
                    </div>
                  )}

                  {diagnostic?.materialSuggestions && (
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Materiales Sugeridos:</span>
                      <p className="text-slate-900 leading-relaxed whitespace-pre-wrap text-[11px] bg-white border border-slate-200/50 p-2.5 rounded shadow-xs">{diagnostic.materialSuggestions}</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-150 font-sans">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Dictamen de Preingeniería</span>
                  
                  {diagnostic ? (
                    <div className={`p-4 rounded border flex items-center justify-between ${
                      diagnostic.status === 'aprobado' ? 'bg-emerald-55/40 border-emerald-350 text-emerald-850' :
                      diagnostic.status === 'requiere_visita' ? 'bg-amber-50/50 border-amber-300 text-amber-800' :
                      diagnostic.status === 'rechazado' ? 'bg-red-50/40 border-red-300 text-red-800' :
                      'bg-slate-50 border-slate-250 text-slate-500'
                    }`}>
                      <div>
                        <span className="block text-[8px] font-bold uppercase tracking-widest text-slate-400">Veredicto Técnico</span>
                        <span className="text-xs font-black uppercase mt-0.5 block">
                          {diagnostic.status === 'aprobado' ? 'APROBADO / VIABLE' :
                           diagnostic.status === 'requiere_visita' ? 'REQUIERE INSPECCIÓN' :
                           diagnostic.status === 'rechazado' ? 'RECHAZADO / INVIABLE' :
                           'PENDIENTE'}
                        </span>
                      </div>
                      {diagnostic.verdictNotes && (
                        <div className="text-[11px] text-right italic font-medium max-w-[60%] border-l border-slate-300/40 pl-3">
                          "{diagnostic.verdictNotes}"
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-200 rounded p-5 text-center text-slate-450 text-xs font-medium">
                      Sin diagnóstico ni veredicto técnico registrado.
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* OPORTUNIDAD COMERCIAL */}
          <section className="bg-white border border-slate-200 rounded shadow-xs p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4 shrink-0">
                <Shield className="w-4.5 h-4.5 text-slate-700" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">Oportunidad Comercial B2B</h3>
              </div>
              
              {isTechnicalUser ? (
                /* CONFIDENCIAL PARA TÉCNICOS */
                <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                  <Shield className="w-10 h-10 text-slate-350 mb-3 animate-pulse" />
                  <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Información Confidencial</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[220px] leading-normal font-semibold">
                    Las valoraciones financieras y estados del forecast están protegidos.
                  </p>
                </div>
              ) : opportunity ? (
                /* DETALLES DE LA OPORTUNIDAD */
                <div className="space-y-4 text-xs font-sans">
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nombre del Proyecto</span>
                    <h4 className="text-xs font-bold text-slate-900 uppercase">{opportunity.title}</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3.5 border border-slate-200/60 rounded">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Valor Estimado</span>
                      <span className="font-mono text-sm font-bold text-emerald-650">
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(opportunity.estimatedValue)}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3.5 border border-slate-200/60 rounded">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Probabilidad Forecast</span>
                      <span className="font-mono text-sm font-bold text-slate-900">{opportunity.probability}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3.5 border border-slate-200/60 rounded">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Etapa Comercial</span>
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">{opportunity.stage.replace("_", " ")}</span>
                    </div>
                    <div className="bg-slate-50 p-3.5 border border-slate-200/60 rounded">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Asesor Asignado</span>
                      <span className="text-xs font-bold text-slate-800 truncate block">{opportunity.assignedTo}</span>
                    </div>
                  </div>

                  {opportunity.expectedCloseDate && (
                    <div className="pt-3.5 border-t border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider flex justify-between font-bold">
                      <span>Cierre Esperado:</span>
                      <span className="text-slate-800">{new Date(opportunity.expectedCloseDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded">
                  No se ha registrado oportunidad comercial para este lead.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* REPOSITORIO DOCUMENTAL B2B */}
        <section className="bg-white border border-slate-200 rounded shadow-xs p-5 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-slate-700" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">Repositorio Documental B2B</h3>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs font-bold uppercase tracking-wider rounded text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-xs">
              <UploadCloud className="w-4 h-4" /> Subir Archivo
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Technical Reports PDF */}
            {(lead.diagnosticReports || []).map((diag, index) => diag.generatedPdfUrl && (
              <div key={`diag-${diag.id || index}`} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/60 rounded group hover:border-slate-400 transition-colors">
                <div className="p-2 bg-red-500/10 rounded">
                  <FileText className="w-5 h-5 text-red-650" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">Reporte_Preingenieria_{index + 1}.pdf</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">
                    {diag.airflow ? `${diag.airflow} CFM` : 'Sin caudal'} • {new Date(diag.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <a href={diag.generatedPdfUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors">
                  <Download className="w-4 h-4" />
                </a>
              </div>
            ))}

            {/* Proposal Documents */}
            {(lead.crmProposals || []).map((prop, index) => (
              <div key={`prop-${prop.id || index}`} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/60 rounded group hover:border-slate-400 transition-colors">
                <div className="p-2 bg-emerald-500/10 rounded">
                  <FileText className="w-5 h-5 text-emerald-650" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{prop.title}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">
                    {isTechnicalUser ? (
                      <span className="font-mono text-[9px] font-bold text-red-600 bg-red-50/50 border border-red-150 px-1 py-0.25 rounded">
                        [CONFIDENCIAL]
                      </span>
                    ) : (
                      `$${Math.round(prop.totalValue / 1000000).toFixed(1)}M COP`
                    )}
                    {` • Etapa: ${prop.status}`}
                  </p>
                </div>
                {prop.pdfUrl && (
                  <a href={prop.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors">
                    <Download className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}

            {/* Custom Uploaded Documents */}
            {(lead.crmDocuments || []).map((doc, index) => (
              <div key={`doc-${doc.id || index}`} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/60 rounded group hover:border-slate-400 transition-colors">
                <div className={`p-2 rounded ${doc.fileType.includes('image') ? 'bg-blue-500/10' : 'bg-red-500/10'}`}>
                  {doc.fileType.includes('image') ? (
                    <ImageIcon className="w-5 h-5 text-blue-500" />
                  ) : (
                    <FileText className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{doc.fileName}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">{new Date(doc.createdAt).toLocaleDateString()}</p>
                </div>
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors">
                  <Download className="w-4 h-4" />
                </a>
              </div>
            ))}

            {(!lead.crmDocuments?.length && !lead.crmProposals?.length && !lead.diagnosticReports?.some(d => d.generatedPdfUrl)) && (
              <div className="col-span-full text-xs text-slate-400 text-center py-4 font-medium">
                No hay documentos ni cotizaciones registradas para esta oportunidad.
              </div>
            )}
          </div>
        </section>
      </main>

      {/* MODAL: REGISTRAR ACTIVIDAD */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded w-full max-w-md p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setActivityModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-black uppercase tracking-widest text-slate-900 mb-4">Registrar Actividad</h3>
            <form onSubmit={handleCreateActivity} className="space-y-4 text-xs font-semibold">
              {errorMsg && <p className="text-red-650 text-xs font-bold bg-red-50 border border-red-200 p-2 rounded">{errorMsg}</p>}
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Tipo de Actividad</label>
                <select name="activityType" required className="p-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-800 focus:border-slate-400 focus:outline-none cursor-pointer font-bold">
                  <option value="call">Llamada Telefónica</option>
                  <option value="email">Correo Enviado</option>
                  <option value="call">WhatsApp</option>
                  <option value="meeting">Reunión Online</option>
                  <option value="visit">Visita Técnica</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Notas / Resumen</label>
                <textarea 
                  name="description" 
                  required 
                  rows={3} 
                  placeholder="Detalles sobre lo acordado con el cliente..." 
                  className="p-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
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
                  disabled={savingActivity} 
                  type="submit" 
                  className="px-5 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded text-[11px] font-bold uppercase tracking-wider"
                >
                  {savingActivity ? "Guardando..." : "Guardar Actividad"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PROGRAMAR TAREA */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded w-full max-w-md p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setTaskModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-black uppercase tracking-widest text-slate-900 mb-4">Programar Tarea</h3>
            <form onSubmit={handleCreateTask} className="space-y-4 text-xs font-semibold">
              {errorMsg && <p className="text-red-655 text-xs font-bold bg-red-50 border border-red-250 p-2 rounded">{errorMsg}</p>}
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">¿Qué se debe hacer? *</label>
                <input 
                  name="taskType" 
                  required 
                  type="text" 
                  placeholder="Ej: Enviar cotización, Llamar para concretar..." 
                  className="p-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-800 focus:border-slate-400 focus:outline-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Fecha Límite</label>
                  <input 
                    name="dueDate" 
                    required 
                    type="date" 
                    className="p-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-800 focus:border-slate-400 focus:outline-none cursor-pointer" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Hora Límite</label>
                  <input 
                    name="dueTime" 
                    required 
                    type="time" 
                    className="p-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-800 focus:border-slate-400 focus:outline-none cursor-pointer" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Asignado a</label>
                <select 
                  name="assignedTo" 
                  defaultValue={assignedTo || ""} 
                  className="p-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-800 focus:border-slate-400 focus:outline-none cursor-pointer font-bold"
                >
                  <option value="">Sin Asignar</option>
                  {allCrmUsers.filter(u => ["admin", "comercial", "director_comercial"].includes(u.role)).map(u => (
                    <option key={u.id} value={u.email}>{u.fullName || u.email}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Notas de la Tarea</label>
                <textarea 
                  name="notes" 
                  rows={2} 
                  placeholder="Detalles o instrucciones adicionales..." 
                  className="p-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
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
                  disabled={savingTask} 
                  type="submit" 
                  className="px-5 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded text-[11px] font-bold uppercase tracking-wider"
                >
                  {savingTask ? "Guardando..." : "Guardar Tarea"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
