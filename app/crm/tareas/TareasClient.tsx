"use client";

import React, { useState, useTransition } from "react";
import {
  Search, Plus, Calendar, AlertTriangle, CheckCircle2, X,
  ChevronDown, Loader2, Building2,
} from "lucide-react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  updateTaskStatusAction,
  createTaskFullAction,
  type LeadSelectItem,
  type CreateTaskInput,
} from "@/lib/server-actions/crm";

// ─── Types ───────────────────────────────────────────────────────────────────

type TaskRow = {
  task: {
    id: string;
    taskType: string;
    status: string;
    dueDate: string;
    assignedTo: string | null;
    notes: string | null;
    priority: string | null;
  };
  leadName: string | null;
  companyName: string;
  environmentType: string;
};

interface TareasClientProps {
  tasksData: TaskRow[];
  leadsForSelect: LeadSelectItem[];
  userRole: string;
}

// ─── Field Error Component ────────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="text-[11px] text-red-700 font-medium mt-1 leading-tight">{msg}</p>
  );
}

// ─── Nueva Tarea Modal ─────────────────────────────────────────────────────────

function NuevaTareaModal({
  leadsForSelect,
  userRole,
}: {
  leadsForSelect: LeadSelectItem[];
  userRole: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState<{
    leadId: string;
    taskType: CreateTaskInput["taskType"] | "";
    priority: CreateTaskInput["priority"] | "";
    dueDate: string;
    assignedTo: string;
    notes: string;
  }>({
    leadId: "",
    taskType: "",
    priority: "",
    dueDate: "",
    assignedTo: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const validate = () => {
    const e: typeof errors = {};
    if (!form.leadId) e.leadId = "Selecciona el proyecto / cliente asociado.";
    if (!form.taskType) e.taskType = "Selecciona el tipo de tarea.";
    if (!form.priority) e.priority = "Selecciona la prioridad.";
    if (!form.dueDate) e.dueDate = "La fecha límite es obligatoria.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    startTransition(async () => {
      const res = await createTaskFullAction({
        leadId: form.leadId,
        taskType: form.taskType as CreateTaskInput["taskType"],
        priority: form.priority as CreateTaskInput["priority"],
        dueDate: new Date(form.dueDate).toISOString(),
        assignedTo: form.assignedTo || undefined,
        notes: form.notes || undefined,
      });

      if (res.success) {
        setOpen(false);
        setForm({ leadId: "", taskType: "", priority: "", dueDate: "", assignedTo: "", notes: "" });
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

  const canAssign = userRole === "admin" || userRole === "super_admin" || userRole === "director_comercial";

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button
          id="btn-nueva-tarea"
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white border border-transparent rounded-md text-sm font-bold shadow-sm hover:bg-slate-700 transition-colors duration-150"
        >
          <Plus className="w-4 h-4" /> Nueva Tarea
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-[2px]" style={{ animation: "fadeIn 0.15s ease" }} />

        {/* Panel — adaptable a móvil */}
        <Dialog.Content
          className="fixed z-[9999] bg-white border border-slate-200 shadow-2xl outline-none
            /* Desktop: centrado */ left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-lg rounded-md
            /* Mobile override */ sm:rounded-md"
          style={{ animation: "slideUpScale 0.15s ease-out", maxHeight: "90svh", overflowY: "auto" }}
          aria-describedby="dialog-nueva-tarea-desc"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <Dialog.Title className="text-base font-bold text-slate-800 tracking-tight">
                Nueva Tarea Operativa
              </Dialog.Title>
              <Dialog.Description id="dialog-nueva-tarea-desc" className="text-xs text-slate-400 mt-0.5">
                Asocia la tarea a un proyecto y configura su prioridad.
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

              {/* Proyecto / Cliente en cascada */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Proyecto <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    id="tarea-lead"
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

              {/* Tipo de tarea */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Tipo de Tarea <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="tarea-tipo"
                    value={form.taskType}
                    onChange={e => { setForm(f => ({ ...f, taskType: e.target.value as CreateTaskInput["taskType"] })); setErrors(er => ({ ...er, taskType: undefined })); }}
                    className={`${inputBase} ${errors.taskType ? inputError : inputNormal}`}
                  >
                    <option value="">— Seleccionar tipo —</option>
                    <option value="visita_tecnica">Visita Técnica</option>
                    <option value="llamada">Llamada Comercial</option>
                    <option value="reunion">Reunión</option>
                    <option value="tarea">Revisión de Ingeniería</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <FieldError msg={errors.taskType} />
              </div>

              {/* Prioridad */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Prioridad <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {(["critica", "alta", "media"] as const).map(p => {
                    const active = form.priority === p;
                    const colors: Record<string, string> = {
                      critica: active ? "bg-red-700 text-white border-red-700" : "border-red-200 text-red-700 hover:bg-red-50",
                      alta: active ? "bg-slate-700 text-white border-slate-700" : "border-slate-200 text-slate-700 hover:bg-slate-50",
                      media: active ? "bg-slate-400 text-white border-slate-400" : "border-slate-200 text-slate-500 hover:bg-slate-50",
                    };
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => { setForm(f => ({ ...f, priority: p })); setErrors(er => ({ ...er, priority: undefined })); }}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded border transition-colors duration-150 ${colors[p]}`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                <FieldError msg={errors.priority} />
              </div>

              {/* Fecha límite */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Fecha Límite <span className="text-red-500">*</span>
                </label>
                <input
                  id="tarea-fecha"
                  type="datetime-local"
                  value={form.dueDate}
                  onChange={e => { setForm(f => ({ ...f, dueDate: e.target.value })); setErrors(er => ({ ...er, dueDate: undefined })); }}
                  className={`${inputBase} ${errors.dueDate ? inputError : inputNormal}`}
                />
                <FieldError msg={errors.dueDate} />
              </div>

              {/* Asignado a (solo admin) */}
              {canAssign && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Asignar a (Ingeniero / Técnico)
                  </label>
                  <input
                    id="tarea-asignado"
                    type="text"
                    placeholder="Nombre del responsable"
                    value={form.assignedTo}
                    onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
                    className={`${inputBase} ${inputNormal}`}
                  />
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Notas Adicionales
                </label>
                <textarea
                  id="tarea-notas"
                  rows={3}
                  placeholder="Instrucciones técnicas, materiales requeridos, contexto..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className={`${inputBase} resize-none ${inputNormal}`}
                />
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
                {isPending ? "Guardando..." : "Crear Tarea"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Date Badge ───────────────────────────────────────────────────────────────

function DateBadge({ dateString }: { dateString: string }) {
  const date = new Date(dateString);
  if (isPast(date) && !isToday(date)) {
    return (
      <div className="flex items-center gap-1 text-red-600 text-[11px] font-medium">
        <AlertTriangle className="w-3 h-3" />
        <span>Vencida</span>
      </div>
    );
  }
  if (isToday(date)) return <span className="text-red-600 font-bold text-[11px]">Hoy, {format(date, "HH:mm")}</span>;
  if (isTomorrow(date)) return <span className="text-slate-500 text-[11px]">Mañana</span>;
  return <span className="text-slate-500 text-[11px]">{format(date, "EEE, d MMM", { locale: es })}</span>;
}

// ─── Kanban Column ────────────────────────────────────────────────────────────

function KanbanColumn({
  title,
  priorityValue,
  items,
  onComplete,
  loadingId,
}: {
  title: string;
  priorityValue: string;
  items: TaskRow[];
  onComplete: (id: string) => void;
  loadingId: string | null;
}) {
  const isCritica = priorityValue === "critica";
  const isAlta = priorityValue === "alta";

  const dotColor = isCritica ? "bg-red-600" : isAlta ? "bg-slate-600" : "bg-slate-400";
  const badgeBg = isCritica ? "bg-red-50" : isAlta ? "bg-slate-50" : "bg-slate-50";
  const badgeText = isCritica ? "text-red-700" : isAlta ? "text-slate-700" : "text-slate-500";

  return (
    <div className="flex-1 w-full md:max-w-[400px] flex flex-col">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <h3 className="font-bold text-slate-800 text-base">{title}</h3>
        </div>
        <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded border border-slate-200">
          {items.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 md:overflow-y-auto overflow-visible space-y-4 pb-10">
        {items.map(({ task, companyName, environmentType }, idx) => (
          <div
            key={task.id}
            className="bg-white border-y border-r border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow duration-150 relative"
          >
            <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${dotColor}`} />
            <div className="p-4 pl-5">
              <div className="flex justify-between items-start mb-2">
                <span className={`${badgeBg} ${badgeText} text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-slate-200`}>
                  T-{(task.id.replace(/\D/g, "") || (8000 + idx).toString()).substring(0, 4)}
                </span>
                <button
                  onClick={() => onComplete(task.id)}
                  disabled={loadingId === task.id}
                  className="p-1 hover:bg-emerald-50 text-slate-300 hover:text-emerald-600 rounded transition-colors"
                  title="Marcar como realizada"
                >
                  {loadingId === task.id
                    ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    : <CheckCircle2 className="w-4 h-4" />
                  }
                </button>
              </div>

              <h4 className="font-bold text-slate-800 text-sm leading-tight mb-2">
                {companyName} | {environmentType || "Planta Principal"}
              </h4>

              <p className="text-xs text-slate-500 mb-3">
                {task.taskType === "visita_tecnica" ? "Visita Técnica"
                  : task.taskType === "reunion" ? "Reunión"
                  : task.taskType === "llamada" ? "Llamada Comercial"
                  : "Revisión de Ingeniería"}
              </p>

              <div className="h-px bg-slate-100 w-full mb-3" />

              {task.notes && (
                <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                  {task.notes}
                </p>
              )}

              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold border border-slate-200">
                    {task.assignedTo ? task.assignedTo.substring(0, 2).toUpperCase() : "CY"}
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{task.assignedTo || "CYH"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <DateBadge dateString={task.dueDate} />
                </div>
              </div>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="p-4 border border-dashed border-slate-200 rounded-md text-center text-xs text-slate-400">
            Columna vacía
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Client Component ─────────────────────────────────────────────────────

export default function TareasClient({ tasksData, leadsForSelect, userRole }: TareasClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);

  const handleCompleteTask = async (taskId: string) => {
    try {
      setLoadingTaskId(taskId);
      const res = await updateTaskStatusAction(taskId, "completado");
      if (!res.success) alert("Error al completar la tarea: " + res.error);
      else router.refresh();
    } finally {
      setLoadingTaskId(null);
    }
  };

  const getPriority = (task: TaskRow["task"]) => {
    if (task.priority && ["critica", "alta", "media"].includes(task.priority)) return task.priority;
    if (task.priority === "high" || task.priority === "critical") return "critica";
    if (task.priority === "normal") return "alta";
    return "media";
  };

  const processed = tasksData
    .filter(t => t.task.status !== "completado")
    .map(t => ({ ...t, _priority: getPriority(t.task) }));

  const filtered = processed.filter(t =>
    t.task.taskType?.toLowerCase().includes(search.toLowerCase()) ||
    t.task.notes?.toLowerCase().includes(search.toLowerCase()) ||
    t.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    t.environmentType?.toLowerCase().includes(search.toLowerCase())
  );

  const critica = filtered.filter(t => t._priority === "critica");
  const alta = filtered.filter(t => t._priority === "alta");
  const media = filtered.filter(t => t._priority === "media");

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

      <div className="flex flex-col md:h-[calc(100vh-4rem)] h-auto min-h-screen md:overflow-hidden overflow-visible bg-slate-50 font-sans">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4 shrink-0 px-8 pt-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestión de Tareas</h1>
            <p className="text-sm text-slate-500 mt-1">Monitoreo de actividades operativas e ingeniería en el Kanban B2B.</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar tarea..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-md w-56 focus:outline-none focus:border-slate-400 shadow-sm transition-colors"
              />
            </div>

            {/* Modal de nueva tarea */}
            <NuevaTareaModal leadsForSelect={leadsForSelect} userRole={userRole} />
          </div>
        </div>

        {/* KANBAN BOARD */}
        <div className="flex-1 flex flex-col md:flex-row md:overflow-x-auto overflow-visible gap-6 px-8 pb-8">
          <KanbanColumn title="Prioridad Crítica" priorityValue="critica" items={critica} onComplete={handleCompleteTask} loadingId={loadingTaskId} />
          <KanbanColumn title="Prioridad Alta" priorityValue="alta" items={alta} onComplete={handleCompleteTask} loadingId={loadingTaskId} />
          <KanbanColumn title="Prioridad Media" priorityValue="media" items={media} onComplete={handleCompleteTask} loadingId={loadingTaskId} />
        </div>
      </div>
    </>
  );
}
