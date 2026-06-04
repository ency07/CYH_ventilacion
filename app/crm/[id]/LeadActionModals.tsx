"use client";

import React, { useState } from "react";
import { Plus, X, Phone, Mail, MapPin, Calendar, Clock, Check } from "lucide-react";
import { createActivityLogAction, createTaskAction } from "@/lib/server-actions/crm";

export default function LeadActionModals({ leadId, assignedTo = "Sin Asignar" }: { leadId: string, assignedTo?: string }) {
  const [isActivityModalOpen, setActivityModalOpen] = useState(false);
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateActivity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const data = {
      leadId,
      activityType: formData.get("activityType") as string,
      description: formData.get("description") as string,
    };
    
    const res = await createActivityLogAction(data);
    if (res.success) {
      setActivityModalOpen(false);
    } else {
      setError(res.error);
    }
    setLoading(false);
  };

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    
    const date = formData.get("dueDate") as string;
    const time = formData.get("dueTime") as string;
    const combinedDateTime = `${date}T${time}:00`;

    const data = {
      leadId,
      taskType: formData.get("taskType") as string,
      dueDate: combinedDateTime,
      notes: formData.get("notes") as string,
      assignedTo: formData.get("assignedTo") as string || assignedTo,
    };

    const res = await createTaskAction(data);
    if (res.success) {
      setTaskModalOpen(false);
    } else {
      setError(res.error);
    }
    setLoading(false);
  };

  return (
    <>
      <div className="flex flex-col gap-2 mt-4">
        <button 
          onClick={() => setActivityModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-bg-tertiary border border-border-subtle rounded-md text-xs font-bold uppercase tracking-wider text-text-primary hover:border-accent-cyan hover:text-accent-cyan transition-colors w-full"
        >
          <Plus className="w-4 h-4" /> Registrar Actividad
        </button>
        <button 
          onClick={() => setTaskModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-text-primary text-bg-primary rounded-md text-xs font-bold uppercase tracking-wider hover:bg-text-secondary transition-colors w-full"
        >
          <Check className="w-4 h-4" /> Programar Tarea
        </button>
      </div>

      {/* Activity Modal */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-bg-primary w-full max-w-md rounded-lg shadow-xl border border-border-subtle flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-border-subtle">
              <h2 className="text-lg font-display font-bold uppercase text-text-primary">Registrar Actividad</h2>
              <button onClick={() => setActivityModalOpen(false)} className="text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateActivity} className="p-4 flex flex-col gap-4">
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wide">Tipo de Actividad</label>
                <select name="activityType" required className="p-2 bg-bg-secondary border border-border-subtle rounded-md text-sm text-text-primary focus:border-accent-cyan focus:outline-none">
                  <option value="llamada">Llamada Telefónica</option>
                  <option value="correo">Correo Enviado</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="reunion_online">Reunión Online</option>
                  <option value="visita_tecnica">Visita Técnica</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wide">Notas de la actividad</label>
                <textarea name="description" required rows={3} placeholder="¿Qué se habló con el cliente?" className="p-2 bg-bg-secondary border border-border-subtle rounded-md text-sm text-text-primary focus:border-accent-cyan focus:outline-none"></textarea>
              </div>
              <button disabled={loading} type="submit" className="mt-2 py-2 bg-accent-cyan text-bg-primary font-bold uppercase text-sm rounded-md hover:bg-[#00D1D1] transition-colors disabled:opacity-50">
                {loading ? 'Guardando...' : 'Guardar Actividad'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-bg-primary w-full max-w-md rounded-lg shadow-xl border border-border-subtle flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-border-subtle">
              <h2 className="text-lg font-display font-bold uppercase text-text-primary">Programar Tarea</h2>
              <button onClick={() => setTaskModalOpen(false)} className="text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-4 flex flex-col gap-4">
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wide">¿Qué se debe hacer?</label>
                <input name="taskType" required type="text" placeholder="Ej: Enviar propuesta, Llamar al cliente..." className="p-2 bg-bg-secondary border border-border-subtle rounded-md text-sm text-text-primary focus:border-accent-cyan focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wide">Fecha</label>
                  <input name="dueDate" required type="date" className="p-2 bg-bg-secondary border border-border-subtle rounded-md text-sm text-text-primary focus:border-accent-cyan focus:outline-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wide">Hora</label>
                  <input name="dueTime" required type="time" className="p-2 bg-bg-secondary border border-border-subtle rounded-md text-sm text-text-primary focus:border-accent-cyan focus:outline-none" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wide">Asignar a</label>
                <input name="assignedTo" type="text" defaultValue={assignedTo} className="p-2 bg-bg-secondary border border-border-subtle rounded-md text-sm text-text-primary focus:border-accent-cyan focus:outline-none" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wide">Notas Adicionales</label>
                <textarea name="notes" rows={2} className="p-2 bg-bg-secondary border border-border-subtle rounded-md text-sm text-text-primary focus:border-accent-cyan focus:outline-none"></textarea>
              </div>
              <button disabled={loading} type="submit" className="mt-2 py-2 bg-text-primary text-bg-primary font-bold uppercase text-sm rounded-md hover:bg-text-secondary transition-colors disabled:opacity-50">
                {loading ? 'Guardando...' : 'Guardar Tarea'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
