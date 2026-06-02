"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getLeadByIdAction } from "@/lib/server-actions/leads";
import { getDiagnosticByLeadIdAction } from "@/lib/server-actions/diagnostics";
import { 
  getPipelineByLeadIdAction,
  getActivityLogsByLeadIdAction,
  createActivityLogAction,
  updateLeadStatusAction,
  updateCommercialDataAction
} from "@/lib/server-actions/crm";
import { 
  ArrowLeft, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Target, 
  DollarSign,
  Calendar,
  Send,
  FileText,
  User,
  Clock,
  Activity,
  Briefcase
} from "lucide-react";
import Link from "next/link";

export default function LeadDetailPage() {
  const params = useParams();
  const leadId = params.id as string;

  const [lead, setLead] = useState<any>(null);
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [pipeline, setPipeline] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState("call");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // FASE 5.2: Commercial Editable Fields
  const [assignedTo, setAssignedTo] = useState("");
  const [probability, setProbability] = useState(10);
  const [nextMeeting, setNextMeeting] = useState("");
  const [nextTask, setNextTask] = useState("");
  const [isSavingCommercial, setIsSavingCommercial] = useState(false);

  useEffect(() => {
    if (leadId) fetchLeadDetails();
  }, [leadId]);

  const fetchLeadDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const leadRes = await getLeadByIdAction(leadId);
      if (!leadRes.success) throw new Error(leadRes.error);
      setLead(leadRes.data);

      const diagRes = await getDiagnosticByLeadIdAction(leadId);
      if (diagRes.success) setDiagnostic(diagRes.data);

      const pipeRes = await getPipelineByLeadIdAction(leadId);
      if (pipeRes.success && pipeRes.data) {
        setPipeline(pipeRes.data);
        setAssignedTo(pipeRes.data.assignedTo || "");
        setProbability(pipeRes.data.probability || 10);
        setNextMeeting(pipeRes.data.nextMeeting ? new Date(pipeRes.data.nextMeeting).toISOString().slice(0, 16) : "");
        setNextTask(pipeRes.data.nextTask || "");
      }

      const logsRes = await getActivityLogsByLeadIdAction(leadId);
      if (logsRes.success) setLogs(logsRes.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Fallo al cargar el expediente comercial.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setStatusUpdating(true);
      const res = await updateLeadStatusAction(leadId, newStatus);
      if (res.success) {
        setLead({ ...lead, status: newStatus });
        const logsRes = await getActivityLogsByLeadIdAction(leadId);
        if (logsRes.success) setLogs(logsRes.data || []);
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      alert(`Error: No se pudo actualizar el estado comercial.\n${err.message}`);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleSaveCommercialData = async () => {
    try {
      setIsSavingCommercial(true);
      const res = await updateCommercialDataAction(leadId, assignedTo, probability, nextMeeting, nextTask);
      if (res.success) {
        // Optimistic UI update
        setPipeline({ ...pipeline, assignedTo, probability, nextMeeting, nextTask });
        
        // Register activity log for transparency
        await createActivityLogAction({
          leadId,
          activityType: "technical",
          description: `Se actualizó la ficha comercial: Asignado a ${assignedTo || "nadie"}, Probabilidad ${probability}%.`
        });
        
        const logsRes = await getActivityLogsByLeadIdAction(leadId);
        if (logsRes.success) setLogs(logsRes.data || []);
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      alert(`Error guardando datos: ${err.message}`);
    } finally {
      setIsSavingCommercial(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setIsSubmittingNote(true);
      const res = await createActivityLogAction({
        leadId,
        activityType: noteType,
        description: newNote,
      });

      if (res.success) {
        setNewNote("");
        const logsRes = await getActivityLogsByLeadIdAction(leadId);
        if (logsRes.success) setLogs(logsRes.data || []);
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      alert(`Error al guardar la nota.\n${err.message}`);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  if (loading && !lead) {
    return (
      <div className="flex justify-center items-center min-h-[500px] text-slate-500 font-sans text-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800 mr-3"></div>
        Cargando expediente comercial...
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4 font-sans text-sm px-6">
        <div className="text-red-500 text-3xl mb-4">⚠️</div>
        <h4 className="font-bold text-slate-900 text-lg">Lead no encontrado</h4>
        <p className="text-slate-500">
          {error || "El identificador de oportunidad ingresado no existe."}
        </p>
        <Link 
          href="/crm"
          className="inline-flex items-center gap-2 px-4 py-2 mt-4 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al CRM
        </Link>
      </div>
    );
  }

  const prob = pipeline?.probability || 10;
  const valEstimado = lead.estimatedBudgetMax || 0;
  const valPonderado = Math.round(valEstimado * (prob / 100));

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-6 bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* Header Back Button */}
      <Link 
        href="/crm"
        className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-600 text-sm font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Volver al Pipeline
      </Link>

      {/* Title & Stage Selector Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{lead.companyName}</h1>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border tracking-wide ${
              lead.riskLevel === "HOT" ? "bg-red-50 text-red-700 border-red-200" :
              lead.riskLevel === "WARM" ? "bg-amber-50 text-amber-700 border-amber-200" :
              lead.riskLevel === "SPAM" ? "bg-slate-100 text-slate-500 border-slate-300" :
              "bg-slate-50 text-slate-600 border-slate-200"
            }`}>
              {lead.riskLevel === "HOT" ? "ALTO INTERÉS" :
               lead.riskLevel === "WARM" ? "INTERÉS MEDIO" :
               lead.riskLevel === "SPAM" ? "DESCARTADO" : 
               "BAJA PRIORIDAD"}
            </span>
          </div>
          <p className="text-slate-500 text-sm flex items-center gap-2">
            <User className="w-4 h-4" /> {lead.fullName} {lead.position ? `— ${lead.position}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-600">Etapa:</span>
          <select
            value={lead.status}
            disabled={statusUpdating}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="bg-white border border-slate-300 rounded-md py-2 px-4 text-sm text-slate-800 font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
          >
            <option value="nuevo">Nuevo Lead</option>
            <option value="contacto">Contacto Inicial</option>
            <option value="reunion">Reunión Agendada</option>
            <option value="diagnostico">Diagnóstico Técnico</option>
            <option value="propuesta_prep">Propuesta en Preparación</option>
            <option value="propuesta_entregada">Propuesta Entregada</option>
            <option value="negociacion">Negociación</option>
            <option value="ganado">Proyecto Cerrado</option>
            <option value="perdido">Proyecto Perdido</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN: Data (2/3 width on large screens conceptually, but let's do 1/3, 1/3, 1/3 or 2/3 left 1/3 right) */}
        {/* Let's make Left Column span 1, Middle span 1, Right span 1? Or 2-col layout: Details left (col-span-1), Timeline right (col-span-2) */}
        
        <div className="lg:col-span-1 space-y-6">
          
          {/* 1. INFORMACIÓN GENERAL */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" /> Información General
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex flex-col">
                <span className="text-slate-500 text-xs">Contacto</span>
                <span className="font-medium text-slate-900">{lead.fullName}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 text-xs">Correo Electrónico</span>
                <a href={`mailto:${lead.email}`} className="font-medium text-blue-600 hover:underline flex items-center gap-1.5">
                  <Mail className="w-3 h-3" /> {lead.email}
                </a>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 text-xs">Teléfono</span>
                <a href={`tel:${lead.phone}`} className="font-medium text-slate-900 hover:text-blue-600 flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> {lead.phone}
                </a>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 text-xs">Ubicación</span>
                <span className="font-medium text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" /> {lead.city}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 text-xs">Origen de Captura</span>
                <span className="font-medium text-slate-900 capitalize">{lead.source}</span>
              </div>
            </div>
          </div>

          {/* 2. COMERCIAL */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-400" /> Datos Comerciales
            </h3>
            <div className="space-y-4 text-sm">
              <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-500 text-xs">Valor Estimado:</span>
                  <span className="font-bold text-slate-900">${valEstimado.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-500 text-xs">Probabilidad de Cierre:</span>
                  <span className="font-bold text-blue-600">{prob}%</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 mt-2">
                  <span className="text-slate-500 text-xs font-semibold">Valor Ponderado:</span>
                  <span className="font-bold text-emerald-600">${valPonderado.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="text-slate-500 text-xs">Responsable Asignado</span>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  onBlur={handleSaveCommercialData}
                  disabled={isSavingCommercial}
                  className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-sm font-medium text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Sin Asignar</option>
                  <option value="Admin">Administrador (Tú)</option>
                  <option value="Andres G">Andrés G.</option>
                  <option value="Camilo V">Camilo V.</option>
                  <option value="Soporte Técnico">Soporte Técnico</option>
                </select>
              </div>
              
              <div className="flex flex-col gap-1 pt-2 border-t border-slate-100 mt-2">
                <span className="text-slate-500 text-xs flex justify-between">
                  Probabilidad Manual 
                  <span className="font-bold text-blue-600">{probability}%</span>
                </span>
                <input 
                  type="range" 
                  min="0" max="100" step="10"
                  value={probability}
                  onChange={(e) => setProbability(Number(e.target.value))}
                  onMouseUp={handleSaveCommercialData}
                  disabled={isSavingCommercial}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* FASE 5.2B: Next Steps */}
              <div className="flex flex-col gap-1 pt-2 border-t border-slate-100 mt-2">
                <span className="text-slate-500 text-xs flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Próxima Reunión
                </span>
                <input 
                  type="datetime-local" 
                  value={nextMeeting}
                  onChange={(e) => setNextMeeting(e.target.value)}
                  onBlur={handleSaveCommercialData}
                  disabled={isSavingCommercial}
                  className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1 mt-1">
                <span className="text-slate-500 text-xs">Próxima Tarea</span>
                <input 
                  type="text" 
                  placeholder="Ej. Enviar cotización técnica..."
                  value={nextTask}
                  onChange={(e) => setNextTask(e.target.value)}
                  onBlur={handleSaveCommercialData}
                  disabled={isSavingCommercial}
                  className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 3. DIAGNÓSTICO RESUMEN */}
          {diagnostic && (
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-slate-400" /> Necesidad Técnica
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex flex-col">
                  <span className="text-slate-500 text-xs">Servicio Solicitado</span>
                  <span className="font-medium text-slate-900 capitalize">{lead.serviceType}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500 text-xs">Entorno Operativo</span>
                  <span className="font-medium text-slate-900 capitalize">{lead.environmentType.replace("_", " ")}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500 text-xs">Caudal Referencial Estimado</span>
                  <span className="font-medium text-slate-900">{diagnostic.airflow ? `${diagnostic.airflow.toLocaleString()} m³/h` : "No calculado"}</span>
                </div>

                {diagnostic.generatedPdfUrl && (
                  <div className="pt-2">
                    <a
                      href={diagnostic.generatedPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex justify-center items-center gap-2 py-2 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-md transition-colors"
                    >
                      <FileText className="w-4 h-4" /> Ver Preingeniería PDF
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Timeline & Notes (lg:col-span-2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Note Input Area */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
              Registrar Actividad Comercial
            </h3>
            <form onSubmit={handleAddNote} className="space-y-4">
              <div className="flex gap-4">
                <div className="w-1/3">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Tipo de Actividad</label>
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value)}
                    className="w-full border border-slate-300 rounded-md py-2 px-3 text-sm text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="call">Llamada</option>
                    <option value="email">Correo</option>
                    <option value="meeting">Reunión</option>
                    <option value="visit">Visita Técnica</option>
                    <option value="proposal">Envío de Propuesta</option>
                    <option value="technical">Nota Interna</option>
                  </select>
                </div>
                <div className="w-2/3">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Descripción</label>
                  <textarea
                    rows={2}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Escriba los detalles del seguimiento, acuerdos o próxima acción..."
                    className="w-full border border-slate-300 rounded-md py-2 px-3 text-sm text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingNote || !newNote.trim()}
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-md transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  Guardar Actividad <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" /> Historial de Actividades
            </h3>
            
            <div className="relative pl-6 border-l-2 border-slate-100 space-y-8 pb-4">
              {logs.map((log) => {
                let iconBg = "bg-slate-100 text-slate-500 border-slate-200";
                
                if (log.activityType === "lead_created") iconBg = "bg-emerald-100 text-emerald-600 border-emerald-200";
                if (log.activityType === "status_changed") iconBg = "bg-blue-100 text-blue-600 border-blue-200";
                if (log.activityType === "call") iconBg = "bg-amber-100 text-amber-600 border-amber-200";
                if (log.activityType === "meeting" || log.activityType === "visit") iconBg = "bg-purple-100 text-purple-600 border-purple-200";
                
                return (
                  <div key={log.id} className="relative">
                    <div className={`absolute -left-[35px] top-0.5 h-6 w-6 rounded-full border flex items-center justify-center bg-white ${iconBg.split(" ")[2]}`}>
                      <div className={`h-2.5 w-2.5 rounded-full ${iconBg.split(" ")[0]}`}></div>
                    </div>
                    
                    <div className="bg-slate-50 border border-slate-100 rounded-md p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${iconBg}`}>
                          {log.activityType.replace("_", " ")}
                        </span>
                        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {log.description}
                      </p>
                    </div>
                  </div>
                );
              })}

              {logs.length === 0 && (
                <div className="text-sm text-slate-400 text-center py-4">
                  No hay actividades registradas todavía.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
