"use client";

import React, { useState, useEffect, useTransition } from "react";
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, Clock, Phone, 
  FileText, CheckCircle2, AlertCircle, AlertTriangle, ShieldAlert, Loader2, Save 
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { updateTaskAction } from "@/lib/server-actions/crm";

interface CalendarClientProps {
  tasks: any[];
  currentUser: {
    id: string;
    name: string;
    role: string;
    email: string;
  };
}

export default function CalendarClient({ tasks, currentUser }: CalendarClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Get initial date from URL query parameter ?fecha=YYYY-MM-DD
  const initialDateStr = searchParams.get("fecha");
  const [currentDate, setCurrentDate] = useState(() => {
    if (initialDateStr) {
      const parsed = new Date(initialDateStr + "T12:00:00");
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return new Date();
  });

  const [selectedDay, setSelectedDay] = useState<number>(() => {
    if (initialDateStr) {
      const parsed = new Date(initialDateStr + "T12:00:00");
      if (!isNaN(parsed.getTime())) {
        return parsed.getDate();
      }
    }
    return new Date().getDate();
  });

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  // Sync date changes with URL query parameters ?fecha=
  useEffect(() => {
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, "0");
    const d = String(selectedDay).padStart(2, "0");
    const formatted = `${y}-${m}-${d}`;
    router.push(`/crm/calendario?fecha=${formatted}&modulo=operaciones`, { scroll: false });
  }, [currentDate, selectedDay, router]);

  // Handle month navigation
  const changeMonth = (offset: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
    // Default selected day to 1 or clamp if needed
    setSelectedDay(1);
    setSelectedTaskId(null);
  };

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => {
    const day = new Date(y, m, 1).getDay();
    return day === 0 ? 6 : day - 1; // Convert Sunday=0 to Monday=0
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Generate grid cells
  const gridCells = [];
  for (let i = 0; i < firstDay; i++) {
    gridCells.push({ empty: true, date: null });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    gridCells.push({ empty: false, date: i });
  }
  const remaining = (7 - (gridCells.length % 7)) % 7;
  for (let i = 0; i < remaining; i++) {
    gridCells.push({ empty: true, date: null });
  }

  // Filter tasks for the selected month
  const monthTasks = tasks.filter(t => {
    const d = new Date(t.dueDate);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  // Filter tasks for the selected day
  const selectedDayTasks = monthTasks.filter(t => {
    const d = new Date(t.dueDate);
    return d.getDate() === selectedDay;
  });

  // Automatically select the first task of the day if any
  useEffect(() => {
    if (selectedDayTasks.length > 0) {
      const task = selectedDayTasks[0];
      setSelectedTaskId(task.id);
      setNotesInput(task.notes || "");
    } else {
      setSelectedTaskId(null);
      setNotesInput("");
    }
    setActionError("");
    setActionSuccess("");
  }, [selectedDay, currentDate]);

  const activeTask = tasks.find(t => t.id === selectedTaskId);

  // Check RBAC role restrictions for acts editing
  // Technical user: tecnico, ingeniero, admin, super_admin, etc.
  // comercial/vendedor are blocked from modifying acts/commitments
  const isEditingLocked = currentUser.role === "comercial" || currentUser.role === "vendedor" || currentUser.role === "asesor_comercial";

  const handleSaveAct = async (taskId: string, newStatus?: string) => {
    if (isEditingLocked) {
      setActionError("Acceso denegado: Los asesores comerciales tienen permisos de solo lectura en operaciones.");
      return;
    }

    setActionError("");
    setActionSuccess("");
    
    startTransition(async () => {
      try {
        const payload: { notes?: string; status?: string } = {
          notes: notesInput
        };
        if (newStatus) {
          payload.status = newStatus;
        }

        const res = await updateTaskAction(taskId, payload);
        if (res.success) {
          setActionSuccess("Acta de reunión y compromisos guardados correctamente.");
          router.refresh();
        } else {
          setActionError(res.error || "No se pudo actualizar el compromiso.");
        }
      } catch (err: any) {
        setActionError(err.message || "Error de red al actualizar.");
      }
    });
  };

  const monthName = currentDate.toLocaleString("es-ES", { month: "long" });

  return (
    <div className="flex flex-col lg:flex-row h-auto min-h-screen lg:h-[calc(100vh-4rem)] bg-bg-secondary overflow-visible lg:overflow-hidden font-sans border-t border-border-subtle">
      
      {/* LADO IZQUIERDO: GRILLA DEL CALENDARIO COMPACTA */}
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-visible lg:overflow-y-auto lg:border-r lg:border-border-subtle bg-bg-primary">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-text-primary tracking-tight uppercase">Mesa de Agendamiento Técnico</h1>
            <p className="text-xs text-text-secondary mt-1">Planificación, visitas técnicas de preingeniería y actas de campo.</p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => changeMonth(-1)} 
              className="p-2 border border-border-subtle bg-bg-primary hover:bg-bg-secondary rounded transition-colors text-text-secondary hover:text-text-primary"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-bold text-text-primary capitalize min-w-[120px] text-center">{monthName} {year}</h2>
            <button 
              onClick={() => changeMonth(1)} 
              className="p-2 border border-border-subtle bg-bg-primary hover:bg-bg-secondary rounded transition-colors text-text-secondary hover:text-text-primary"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                const today = new Date();
                setCurrentDate(today);
                setSelectedDay(today.getDate());
              }}
              className="text-xs font-semibold text-text-primary bg-bg-secondary hover:bg-bg-tertiary px-3 py-2 border border-border-subtle rounded transition-colors"
            >
              Hoy
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="border border-border-subtle rounded overflow-hidden shadow-xs">
          <div className="grid grid-cols-7 bg-bg-secondary text-center font-bold text-[10px] text-text-muted uppercase border-b border-border-subtle">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(d => (
              <div key={d} className="py-2.5 border-r border-border-subtle/40 last:border-r-0">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 bg-border-subtle/25 gap-px">
            {gridCells.map((cell, idx) => {
              const isSelected = cell.date === selectedDay;
              const isToday = cell.date === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
              const dayTasks = cell.date ? monthTasks.filter(t => new Date(t.dueDate).getDate() === cell.date) : [];

              return (
                <div 
                  key={idx}
                  onClick={() => cell.date && setSelectedDay(cell.date)}
                  className={`bg-bg-primary min-h-[90px] md:min-h-[110px] p-2 flex flex-col justify-between transition-colors relative group select-none ${
                    cell.empty ? "bg-bg-secondary/20 cursor-default" : "cursor-pointer hover:bg-bg-secondary/40"
                  } ${isSelected ? "ring-1 ring-inset ring-text-primary bg-bg-secondary/20" : ""}`}
                >
                  {!cell.empty && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                          isToday ? "bg-text-primary text-bg-primary font-black" : "text-text-muted"
                        } ${isSelected && !isToday ? "border border-text-primary" : ""}`}>
                          {cell.date}
                        </span>
                        {dayTasks.length > 0 && (
                          <span className="text-[8px] font-bold px-1.5 py-0.25 bg-bg-secondary border border-border-subtle rounded text-text-secondary shadow-2xs">
                            {dayTasks.length}
                          </span>
                        )}
                      </div>

                      {/* Mini indicator labels in the calendar cell */}
                      <div className="mt-1 space-y-1">
                        {dayTasks.slice(0, 2).map((t, tIdx) => (
                          <div 
                            key={tIdx} 
                            className={`px-1 py-0.5 rounded text-[8px] font-bold truncate ${
                              t.taskType === "reunion" ? "bg-blue-50 text-blue-700 border border-blue-200/50" :
                              t.taskType === "llamada" ? "bg-amber-50 text-amber-700 border border-amber-200/50" :
                              t.taskType === "visita_tecnica" ? "bg-purple-50 text-purple-700 border border-purple-200/50" :
                              "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                            }`}
                          >
                            {t.companyName}
                          </div>
                        ))}
                        {dayTasks.length > 2 && (
                          <div className="text-[8px] text-text-muted text-center font-bold">
                            + {dayTasks.length - 2} más
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* LADO DERECHO: PANEL DE DETALLE, COMPROMISOS Y ACTAS DIGITALES */}
      <div className="w-full lg:w-[420px] xl:w-[480px] bg-bg-secondary p-4 md:p-6 overflow-visible lg:overflow-y-auto flex flex-col gap-6">
        <div>
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest border-b border-border-subtle pb-1 block">Compromisos Diarios</span>
          <h2 className="text-base font-bold text-text-primary mt-2 flex items-center gap-2">
            <CalendarIcon className="w-4.5 h-4.5 text-accent-cyan" />
            Agenda del {selectedDay} de {monthName} de {year}
          </h2>
        </div>

        {selectedDayTasks.length === 0 ? (
          <div className="border border-dashed border-border-subtle bg-bg-primary/50 p-8 text-center rounded">
            <Clock className="w-8 h-8 text-text-muted mx-auto mb-2" />
            <p className="text-xs text-text-secondary font-medium">No hay compromisos u órdenes programados para este día.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Compromisos Programados</span>
              <div className="flex flex-wrap gap-2">
                {selectedDayTasks.map(t => {
                  const isTaskActive = t.id === selectedTaskId;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTaskId(t.id);
                        setNotesInput(t.notes || "");
                        setActionError("");
                        setActionSuccess("");
                      }}
                      className={`px-3 py-2 text-xs text-left rounded border flex items-center justify-between gap-3 font-semibold transition-all ${
                        isTaskActive 
                          ? "bg-bg-primary border-text-primary text-text-primary shadow-xs scale-102"
                          : "bg-bg-primary/50 border-border-subtle text-text-secondary hover:border-border-medium"
                      }`}
                    >
                      <span className="truncate max-w-[150px]">{t.companyName}</span>
                      <span className={`w-2 h-2 rounded-full ${
                        t.taskType === "reunion" ? "bg-blue-500" :
                        t.taskType === "llamada" ? "bg-amber-500" :
                        t.taskType === "visita_tecnica" ? "bg-purple-500" :
                        "bg-emerald-500"
                      }`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {activeTask && (
              <div className="bg-bg-primary border border-border-subtle rounded overflow-hidden shadow-xs flex flex-col p-4 gap-4">
                
                {/* Task Meta details */}
                <div className="border-b border-border-subtle pb-3 flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-text-muted">
                      COMPROMISO: ID-{activeTask.id.substring(0, 8).toUpperCase()}
                    </span>
                    <h3 className="font-bold text-text-primary text-sm mt-0.5 uppercase">
                      {activeTask.companyName}
                    </h3>
                    {activeTask.leadName && (
                      <p className="text-[10px] text-text-secondary font-medium">Contacto: {activeTask.leadName}</p>
                    )}
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-wider border px-2 py-0.5 rounded ${
                    activeTask.taskType === "reunion" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    activeTask.taskType === "llamada" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    activeTask.taskType === "visita_tecnica" ? "bg-purple-50 text-purple-700 border-purple-200" :
                    "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}>
                    {activeTask.taskType === "visita_tecnica" ? "Visita Técnica" : activeTask.taskType}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] font-semibold text-text-secondary">
                  <div>
                    <span className="text-[9px] text-text-muted uppercase block mb-0.5">Área Técnica</span>
                    <span className="text-text-primary capitalize">{activeTask.environmentType || "General"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-text-muted uppercase block mb-0.5">Hora Estimada</span>
                    <span className="text-text-primary flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-text-muted" />
                      {format(new Date(activeTask.dueDate), "HH:mm")}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] text-text-muted uppercase block mb-0.5">Asignado a</span>
                    <span className="text-text-primary block truncate font-mono">{activeTask.assignedTo || "Sin asignar"}</span>
                  </div>
                </div>

                {/* Acta de Reunion Digital Form */}
                <div className="border-t border-border-subtle pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-accent-cyan" />
                      Acta de Visita y Compromisos
                    </label>
                    {isEditingLocked && (
                      <span className="text-[8px] bg-amber-50 text-amber-800 border border-amber-200 font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 select-none">
                        <ShieldAlert className="w-3 h-3 text-amber-700" />
                        Lectura Comercial
                      </span>
                    )}
                  </div>

                  <textarea
                    value={notesInput}
                    disabled={isEditingLocked || isPending}
                    onChange={(e) => setNotesInput(e.target.value)}
                    rows={4}
                    placeholder={
                      isEditingLocked 
                        ? "Solo los ingenieros o técnicos pueden documentar el acta." 
                        : "Escribe el acta detallada del levantamiento técnico de campo y compromisos acordados..."
                    }
                    className="w-full text-xs font-semibold p-3 border border-border-subtle bg-bg-secondary rounded focus:outline-none focus:border-text-primary disabled:opacity-75 disabled:cursor-not-allowed leading-relaxed"
                  />

                  {actionError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded text-xs font-bold flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{actionError}</span>
                    </div>
                  )}

                  {actionSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded text-xs font-semibold flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{actionSuccess}</span>
                    </div>
                  )}

                  {!isEditingLocked && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleSaveAct(activeTask.id)}
                        className="flex-1 bg-text-primary text-bg-primary py-2.5 rounded hover:bg-opacity-90 font-bold uppercase tracking-wider text-[10px] flex items-center justify-center gap-2 transition-all"
                      >
                        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Guardar Acta
                      </button>

                      {activeTask.status !== "completado" && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleSaveAct(activeTask.id, "completado")}
                          className="px-4 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 transition-all shadow-xs"
                        >
                          Completar
                        </button>
                      )}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
