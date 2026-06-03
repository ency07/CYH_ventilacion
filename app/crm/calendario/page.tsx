"use client";

import React from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, MapPin, Clock } from "lucide-react";
import Link from "next/link";

export default function CalendarioPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-bg-secondary p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary uppercase tracking-wide">Calendario Comercial</h1>
          <p className="text-sm text-text-muted mt-1">Gestión de tareas, llamadas y visitas técnicas.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-bg-primary rounded-md border border-border-subtle p-1 shadow-sm">
            <button className="px-4 py-1.5 text-xs font-bold bg-bg-tertiary text-text-primary rounded shadow-sm">Mes</button>
            <button className="px-4 py-1.5 text-xs font-bold text-text-secondary hover:text-text-primary">Semana</button>
            <button className="px-4 py-1.5 text-xs font-bold text-text-secondary hover:text-text-primary">Día</button>
          </div>
          <button className="px-4 py-2 bg-text-primary text-bg-primary text-xs font-bold uppercase tracking-wider rounded-md hover:bg-text-secondary transition-colors shadow-md flex items-center gap-2">
            <Plus className="w-4 h-4" /> Agendar
          </button>
        </div>
      </div>

      <div className="flex-1 bg-bg-primary border border-border-subtle rounded-md shadow-sm overflow-hidden flex flex-col">
        {/* Calendar Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-4">
            <button className="p-1 hover:bg-bg-tertiary rounded transition-colors"><ChevronLeft className="w-5 h-5 text-text-secondary" /></button>
            <h2 className="text-lg font-bold text-text-primary capitalize">Octubre 2026</h2>
            <button className="p-1 hover:bg-bg-tertiary rounded transition-colors"><ChevronRight className="w-5 h-5 text-text-secondary" /></button>
          </div>
        </div>
        
        {/* Days of Week */}
        <div className="grid grid-cols-7 border-b border-border-subtle bg-bg-secondary">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(d => (
            <div key={d} className="px-4 py-3 text-xs font-bold text-text-muted uppercase text-center border-r border-border-subtle last:border-0">{d}</div>
          ))}
        </div>

        {/* Grid (Mocked for Layout) */}
        <div className="flex-1 grid grid-cols-7 grid-rows-5 bg-border-subtle gap-px">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="bg-bg-primary p-2 min-h-[100px] hover:bg-bg-secondary/50 transition-colors">
              <span className={`text-xs font-bold ${i === 14 ? 'text-bg-primary bg-text-primary w-6 h-6 flex items-center justify-center rounded-full' : 'text-text-muted'}`}>
                {(i % 31) + 1}
              </span>
              
              {/* Mock Event 1 */}
              {i === 12 && (
                <div className="mt-2 p-1.5 bg-blue-50 border border-blue-200 rounded text-[9px] cursor-pointer hover:-translate-y-0.5 transition-transform">
                  <span className="font-bold text-blue-700 block truncate">Reunión Técnica: ABB</span>
                  <span className="text-blue-600 flex items-center gap-1 mt-0.5"><Clock className="w-2.5 h-2.5"/> 10:00 AM</span>
                </div>
              )}

              {/* Mock Event 2 */}
              {i === 14 && (
                <div className="mt-2 p-1.5 bg-amber-50 border border-amber-200 rounded text-[9px] cursor-pointer hover:-translate-y-0.5 transition-transform">
                  <span className="font-bold text-amber-700 block truncate">Llamar: Cementos Argos</span>
                  <span className="text-amber-600 flex items-center gap-1 mt-0.5"><Phone className="w-2.5 h-2.5"/> 2:00 PM</span>
                </div>
              )}

               {/* Mock Event 3 */}
               {i === 14 && (
                <div className="mt-1 p-1.5 bg-emerald-50 border border-emerald-200 rounded text-[9px] cursor-pointer hover:-translate-y-0.5 transition-transform">
                  <span className="font-bold text-emerald-700 block truncate">Visita: Planta Norte</span>
                  <span className="text-emerald-600 flex items-center gap-1 mt-0.5"><MapPin className="w-2.5 h-2.5"/> 4:00 PM</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
