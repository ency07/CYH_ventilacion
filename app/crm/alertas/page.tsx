import React from "react";
import { Bell } from "lucide-react";

export default function AlertasPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-bg-secondary p-8 font-sans items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="p-4 bg-amber-500/10 rounded-full">
          <Bell className="w-10 h-10 text-amber-500" />
        </div>
        <h1 className="text-2xl font-display font-bold text-text-primary uppercase tracking-wide">
          Centro de Alertas
        </h1>
        <p className="text-sm text-text-muted text-center max-w-md">
          Esta sección está programada para la siguiente fase. Aquí podrás gestionar notificaciones push, avisos de leads estancados y recordatorios urgentes.
        </p>
      </div>
    </div>
  );
}
