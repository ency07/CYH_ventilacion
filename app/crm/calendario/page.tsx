"use client";

import React, { useState, useMemo } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, MapPin, Clock, Phone } from "lucide-react";
import Link from "next/link";

export default function CalendarioPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 1)); // Oct 2026 for demo or new Date()
  const [view, setView] = useState<"mes" | "semana" | "dia">("mes");

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Convert Sunday=0 to Monday=0, Sunday=6
  };

  const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Generamos la grilla (35 o 42 casillas)
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

  // Eventos de prueba anclados a fechas relativas para que siempre se vean
  const mockEvents = [
    { date: 12, type: 'reunion', title: 'Reunión Técnica: ABB', time: '10:00 AM' },
    { date: 14, type: 'llamada', title: 'Llamar: Cementos Argos', time: '2:00 PM' },
    { date: 14, type: 'visita', title: 'Visita: Planta Norte', time: '4:00 PM' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-bg-secondary p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary uppercase tracking-wide">Calendario Comercial</h1>
          <p className="text-sm text-text-muted mt-1">Gestión de tareas, llamadas y visitas técnicas.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-bg-primary rounded-md border border-border-subtle p-1 shadow-sm">
            <button onClick={() => setView("mes")} className={`px-4 py-1.5 text-xs font-bold rounded transition-colors ${view === 'mes' ? 'bg-bg-tertiary text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>Mes</button>
            <button onClick={() => setView("semana")} className={`px-4 py-1.5 text-xs font-bold rounded transition-colors ${view === 'semana' ? 'bg-bg-tertiary text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>Semana</button>
            <button onClick={() => setView("dia")} className={`px-4 py-1.5 text-xs font-bold rounded transition-colors ${view === 'dia' ? 'bg-bg-tertiary text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>Día</button>
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
            <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-bg-tertiary rounded transition-colors"><ChevronLeft className="w-5 h-5 text-text-secondary" /></button>
            <h2 className="text-lg font-bold text-text-primary capitalize w-48 text-center">{monthName} {year}</h2>
            <button onClick={() => changeMonth(1)} className="p-1 hover:bg-bg-tertiary rounded transition-colors"><ChevronRight className="w-5 h-5 text-text-secondary" /></button>
          </div>
          <button onClick={() => setCurrentDate(new Date())} className="text-xs font-bold text-text-secondary hover:text-text-primary uppercase tracking-wider px-3 py-1.5 border border-border-subtle rounded hover:bg-bg-tertiary transition-colors">
            Hoy
          </button>
        </div>
        
        {/* Days of Week */}
        <div className="grid grid-cols-7 border-b border-border-subtle bg-bg-secondary">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(d => (
            <div key={d} className="px-4 py-3 text-xs font-bold text-text-muted uppercase text-center border-r border-border-subtle last:border-0">{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 grid grid-cols-7 bg-border-subtle gap-px overflow-y-auto">
          {gridCells.map((cell, i) => (
            <div key={i} className={`bg-bg-primary p-2 min-h-[120px] transition-colors ${!cell.empty ? 'hover:bg-bg-secondary/50' : 'bg-bg-secondary/20'}`}>
              {!cell.empty && (
                <>
                  <span className={`text-xs font-bold ${cell.date === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear() ? 'text-bg-primary bg-text-primary w-6 h-6 flex items-center justify-center rounded-full' : 'text-text-muted'}`}>
                    {cell.date}
                  </span>
                  
                  {/* Render Events */}
                  <div className="mt-2 space-y-1">
                    {mockEvents.filter(e => e.date === cell.date).map((ev, idx) => (
                      <div key={idx} className={`p-1.5 rounded text-[9px] cursor-pointer hover:-translate-y-0.5 transition-transform border ${
                        ev.type === 'reunion' ? 'bg-blue-50 border-blue-200' :
                        ev.type === 'llamada' ? 'bg-amber-50 border-amber-200' :
                        'bg-emerald-50 border-emerald-200'
                      }`}>
                        <span className={`font-bold block truncate ${
                          ev.type === 'reunion' ? 'text-blue-700' :
                          ev.type === 'llamada' ? 'text-amber-700' :
                          'text-emerald-700'
                        }`}>{ev.title}</span>
                        <span className={`flex items-center gap-1 mt-0.5 ${
                          ev.type === 'reunion' ? 'text-blue-600' :
                          ev.type === 'llamada' ? 'text-amber-600' :
                          'text-emerald-600'
                        }`}>
                          {ev.type === 'reunion' && <Clock className="w-2.5 h-2.5" />}
                          {ev.type === 'llamada' && <Phone className="w-2.5 h-2.5" />}
                          {ev.type === 'visita' && <MapPin className="w-2.5 h-2.5" />}
                          {ev.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
