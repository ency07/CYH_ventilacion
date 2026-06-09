"use client";

import React, { useState, useTransition } from "react";
import {
  Filter, Plus, PhoneCall, Clock, MapPin, CheckSquare, Paperclip, Link as LinkIcon,
  X, ChevronDown, AlertTriangle, Loader2, Building2,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  createActivityFullAction,
  type LeadSelectItem,
  type CreateActivityInput,
} from "@/lib/server-actions/crm";

// ─── Types ───────────────────────────────────────────────────────────────────

type ActivityRow = {
  task: {
    id: string;
    taskType: string;
    status: string;
    dueDate: string;
    assignedTo: string | null;
    notes: string | null;
  };
  lead: { id: string } | null;
  companyName: string;
  environmentType: string;
};

interface ActividadesClientProps {
  activitiesData: ActivityRow[];
  leadsForSelect: LeadSelectItem[];
  userRole: string;
}

// ─── Field Error Component ────────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-[11px] text-red-700 font-medium mt-1 leading-tight">{msg}</p>;
}

// ─── Registrar Actividad Modal ─────────────────────────────────────────────────

function RegistrarActividadModal({
  leadsForSelect,
}: {
  leadsForSelect: LeadSelectItem[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState<{
    leadId: string;
    taskType: CreateActivityInput["taskType"] | "";
    dueDate: string;
    assignedTo: string;
    notes: string;
  }>({
    leadId: "",
    taskType: "",
    dueDate: "",
    assignedTo: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const validate = () => {
    const e: typeof errors = {};
    if (!form.leadId) e.leadId = "Selecciona el proyecto / cliente asociado.";
    if (!form.taskType) e.taskType = "Selecciona el tipo de actividad.";
    if (!form.dueDate) e.dueDate = "La fecha de registro es obligatoria.";
    if (!form.notes.trim()) e.notes = "El acta o descripción de la actividad no puede estar vacía.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    startTransition(async () => {
      const res = await createActivityFullAction({
        leadId: form.leadId,
        taskType: form.taskType as CreateActivityInput["taskType"],
        dueDate: new Date(form.dueDate).toISOString(),
        assignedTo: form.assignedTo || undefined,
        notes: form.notes,
      });

      if (res.success) {
        setOpen(false);
        setForm({ leadId: "", taskType: "", dueDate: "", assignedTo: "", notes: "" });
        setErrors({});
        router.refresh();
      } else {
        setServerError(res.error);
      }
    });
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) {
      setErrors({});
      setServerError(null);
    }
  };

  const inputBase = "w-full px-3 py-2 text-sm bg-white border rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all duration-150 appearance-none";
  const inputError = "border-red-400 ring-1 ring-red-300";
  const inputNormal = "border-slate-200 hover:border-slate-300";

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button
          id="btn-registrar-actividad"
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white border border-transparent rounded-md text-sm font-bold shadow-sm hover:bg-slate-700 transition-colors duration-150"
        >
          <Plus className="w-4 h-4" /> REGISTRAR ACTIVIDAD
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-[2px]" style={{ animation: "fadeIn 0.15s ease" }} />

        <Dialog.Content
          className="fixed z-[9999] bg-white border border-slate-200 shadow-2xl outline-none
            left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-lg rounded-md"
          style={{ animation: "slideUpScale 0.15s ease-out", maxHeight: "90svh", overflowY: "auto" }}
          aria-describedby="dialog-actividad-desc"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <Dialog.Title className="text-base font-bold text-slate-800 tracking-tight">
                Registrar Nueva Actividad
              </Dialog.Title>
              <Dialog.Description id="dialog-actividad-desc" className="text-xs text-slate-400 mt-0.5">
                Documenta visitas, llamadas, reuniones y revisiones de ingeniería.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors" aria-label="Cerrar">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="px-6 py-5 space-y-4">

              {/* Proyecto en cascada */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Proyecto / Cliente <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    id="act-lead"
                    value={form.leadId}
                    onChange={e => { setForm(f => ({ ...f, leadId: e.target.value })); setErrors(er => ({ ...er, leadId: undefined })); }}
                    className={`${inputBase} pl-9 ${errors.leadId ? inputError : inputNormal}`}
                  >
                    <option value="">— Seleccionar empresa | planta —</option>
                    {leadsForSelect.map(l => (
                      <option key={l.leadId} value={l.leadId}>{l.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <FieldError msg={errors.leadId} />
              </div>

              {/* Tipo de actividad — pill selectors */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Tipo de Actividad <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: "visita_tecnica", label: "Visita Técnica", icon: <MapPin className="w-3.5 h-3.5" /> },
                    { value: "llamada", label: "Llamada Comercial", icon: <PhoneCall className="w-3.5 h-3.5" /> },
                    { value: "reunion", label: "Reunión", icon: <Clock className="w-3.5 h-3.5" /> },
                    { value: "tarea", label: "Revisión de Ingeniería", icon: <CheckSquare className="w-3.5 h-3.5" /> },
                  ] as const).map(opt => {
                    const active = form.taskType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setForm(f => ({ ...f, taskType: opt.value })); setErrors(er => ({ ...er, taskType: undefined })); }}
                        className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold rounded border transition-colors duration-150 ${
                          active
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                        }`}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <FieldError msg={errors.taskType} />
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Fecha y Hora <span className="text-red-500">*</span>
                </label>
                <input
                  id="act-fecha"
                  type="datetime-local"
                  value={form.dueDate}
                  onChange={e => { setForm(f => ({ ...f, dueDate: e.target.value })); setErrors(er => ({ ...er, dueDate: undefined })); }}
                  className={`${inputBase} ${errors.dueDate ? inputError : inputNormal}`}
                />
                <FieldError msg={errors.dueDate} />
              </div>

              {/* Asignado a */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Con / Asignado a
                </label>
                <input
                  id="act-asignado"
                  type="text"
                  placeholder="Nombre del contacto o responsable CYH"
                  value={form.assignedTo}
                  onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
                  className={`${inputBase} ${inputNormal}`}
                />
              </div>

              {/* Acta / Descripción — campo obligatorio */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Acta / Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="act-notas"
                  rows={4}
                  placeholder="Detalla los compromisos acordados, observaciones técnicas, decisiones tomadas y siguientes pasos..."
                  value={form.notes}
                  onChange={e => { setForm(f => ({ ...f, notes: e.target.value })); setErrors(er => ({ ...er, notes: undefined })); }}
                  className={`${inputBase} resize-none ${errors.notes ? inputError : inputNormal}`}
                />
                <FieldError msg={errors.notes} />
              </div>

              {/* Server error */}
              {serverError && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-medium">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {serverError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-md">
              <Dialog.Close asChild>
                <button type="button" className="px-4 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors">
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-slate-900 text-white rounded-md hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {isPending ? "Registrando..." : "Registrar Actividad"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getIcon(type: string) {
  switch (type) {
    case "reunion": return <Clock className="w-4 h-4 text-purple-600" />;
    case "llamada": return <PhoneCall className="w-4 h-4 text-blue-600" />;
    case "visita_tecnica": return <MapPin className="w-4 h-4 text-emerald-600" />;
    default: return <CheckSquare className="w-4 h-4 text-slate-600" />;
  }
}

function getIconBg(type: string) {
  switch (type) {
    case "reunion": return "bg-purple-50 border-purple-200";
    case "llamada": return "bg-blue-50 border-blue-200";
    case "visita_tecnica": return "bg-emerald-50 border-emerald-200";
    default: return "bg-slate-50 border-slate-200";
  }
}

function getBorderColor(type: string) {
  switch (type) {
    case "visita_tecnica": return "border-emerald-500";
    case "reunion": return "border-purple-400";
    case "llamada": return "border-blue-400";
    default: return "border-slate-300";
  }
}

function getSpanishTypeName(type: string) {
  switch (type) {
    case "visita_tecnica": return "Visita Técnica";
    case "llamada": return "Llamada Comercial";
    case "reunion": return "Reunión";
    case "tarea": return "Revisión de Ingeniería";
    default: return "Actividad";
  }
}

// ─── Main Client Component ─────────────────────────────────────────────────────

export default function ActividadesClient({ activitiesData, leadsForSelect, userRole }: ActividadesClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tipoParam = searchParams.get("tipo") || "todas";

  const getTabFromParam = (param: string) => {
    switch (param) {
      case "visita": case "visitas": return "technical_visits";
      case "llamada": case "llamadas": return "commercial_calls";
      case "reunion": case "reuniones": return "follow_up_meetings";
      case "revision": case "revisiones": return "engineering_reviews";
      default: return "all";
    }
  };

  const activeTab = getTabFromParam(tipoParam);

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    let value = "todas";
    if (tabId === "technical_visits") value = "visita";
    else if (tabId === "commercial_calls") value = "llamada";
    else if (tabId === "follow_up_meetings") value = "reunion";
    else if (tabId === "engineering_reviews") value = "revision";

    if (value && value !== "todas") params.set("tipo", value);
    else params.delete("tipo");
    router.push(`${pathname}?${params.toString()}`);
  };

  const filteredActivities = activitiesData.filter(item => {
    if (activeTab === "all") return true;
    if (activeTab === "technical_visits") return item.task.taskType === "visita_tecnica";
    if (activeTab === "commercial_calls") return item.task.taskType === "llamada";
    if (activeTab === "follow_up_meetings") return item.task.taskType === "reunion";
    if (activeTab === "engineering_reviews") return item.task.taskType === "tarea";
    return true;
  });

  const groupedByDate: Record<string, ActivityRow[]> = {};
  filteredActivities.forEach(item => {
    const date = new Date(item.task.dueDate);
    const dateKey = format(date, "yyyy-MM-dd");
    if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
    groupedByDate[dateKey].push(item);
  });

  const sortedDateKeys = Object.keys(groupedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const getDayLabel = (dateString: string) => {
    const d = new Date(dateString);
    if (isToday(d)) return `Hoy, ${format(d, "d 'de' MMM", { locale: es })}`;
    if (isYesterday(d)) return `Ayer, ${format(d, "d 'de' MMM", { locale: es })}`;
    return format(d, "d 'de' MMMM, yyyy", { locale: es });
  };

  return (
    <>
      <style>{`
        @keyframes slideUpScale {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 8px)) scale(0.97); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      <div className="flex flex-col md:h-[calc(100vh-4rem)] h-auto min-h-screen md:overflow-hidden overflow-visible bg-white font-sans">

        {/* HEADER */}
        <div className="px-8 pt-8 pb-4 shrink-0 border-b border-slate-200 bg-white z-10 relative">
          <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Historial de Actividades</h1>
              <p className="text-sm text-slate-500 mt-1">Gestión y registro de eventos operativos, visitas y revisiones.</p>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-md text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                <Filter className="w-4 h-4" /> FILTRAR
              </button>
              <RegistrarActividadModal leadsForSelect={leadsForSelect} />
            </div>
          </div>

          {/* Pills navigation */}
          <div className="flex overflow-x-auto gap-2 no-scrollbar pb-1">
            {[
              { id: "all", label: "TODAS" },
              { id: "technical_visits", label: "VISITAS TÉCNICAS" },
              { id: "commercial_calls", label: "LLAMADAS COMERCIALES" },
              { id: "follow_up_meetings", label: "REUNIONES" },
              { id: "engineering_reviews", label: "REVISIONES DE INGENIERÍA" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wider whitespace-nowrap transition-colors border ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 md:overflow-y-auto overflow-visible px-8 py-8 bg-slate-50">
          <div className="max-w-5xl mx-auto">
            {sortedDateKeys.length === 0 ? (
              <div className="text-center py-20 text-slate-400 text-sm">
                No hay actividades que coincidan con el filtro seleccionado.
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-[104px] top-4 bottom-0 w-px bg-slate-200" />

                {sortedDateKeys.map(dateKey => {
                  const dayActivities = groupedByDate[dateKey];
                  return (
                    <div key={dateKey} className="relative mb-12">
                      <div className="flex items-center mb-6 relative z-10">
                        <div className="w-[90px] text-right pr-4 text-xs font-bold text-slate-700">
                          {getDayLabel(dateKey)}
                        </div>
                        <div className="w-[9px] h-[9px] bg-slate-400 rounded-full ml-[6px]" />
                      </div>

                      <div className="space-y-6">
                        {dayActivities.map(({ task, lead, companyName, environmentType }) => {
                          const statusBadgeClass = task.status === "completado"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-50 text-slate-600 border-slate-200";

                          return (
                            <div key={task.id} className="relative ml-[124px]">
                              <div className="absolute -left-[20px] top-6 w-[20px] h-px bg-slate-200" />

                              <div className={`bg-white rounded-md shadow-sm border border-slate-200 p-5 flex gap-4 transition-shadow hover:shadow-md relative overflow-hidden border-l-4 ${getBorderColor(task.taskType)}`}>

                                {/* Icon */}
                                <div className="mt-1 shrink-0">
                                  <div className={`w-10 h-10 rounded flex items-center justify-center border ${getIconBg(task.taskType)}`}>
                                    {getIcon(task.taskType)}
                                  </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between mb-1 gap-4">
                                    <div>
                                      <h3 className="font-bold text-slate-800 text-base">
                                        {getSpanishTypeName(task.taskType)} {environmentType ? `| ${environmentType}` : ""}
                                      </h3>
                                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                                        <Building2 className="w-3 h-3" />
                                        Cliente: {companyName || "CYH Ventilación"}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                      <span className="text-xs font-mono text-slate-400">
                                        {format(new Date(task.dueDate), "hh:mm a")}
                                      </span>
                                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${statusBadgeClass}`}>
                                        {task.status === "completado" ? "COMPLETADO" : "EN PROCESO"}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="mt-4 text-sm text-slate-500 leading-relaxed">
                                    {task.notes || "Actividad registrada sin detalles adicionales."}
                                  </div>

                                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-6">
                                    {task.assignedTo ? (
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold border border-slate-200">
                                          {task.assignedTo.substring(0, 2).toUpperCase()}
                                        </div>
                                        <span className="text-xs text-slate-500 font-medium">Con {task.assignedTo}</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                                        <LinkIcon className="w-3.5 h-3.5" />
                                        Lead #{(lead?.id || "0000").split("-")[0].substring(0, 4)}
                                      </div>
                                    )}

                                    {task.taskType === "visita_tecnica" && (
                                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                        <Paperclip className="w-3.5 h-3.5" />
                                        2 Adjuntos
                                      </div>
                                    )}
                                  </div>
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
            )}
          </div>
        </div>
      </div>
    </>
  );
}
