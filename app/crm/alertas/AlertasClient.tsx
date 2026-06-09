"use client";

import React, { useState } from "react";
import { Bell, AlertTriangle, Clock, FileWarning, UserX, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type AlertItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  date: Date | null;
  leadName: string;
  priority: string;
};

export default function AlertasClient({ initialAlerts }: { initialAlerts: AlertItem[] }) {
  const [alerts, setAlerts] = useState(initialAlerts);

  const dismissAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "tarea_vencida": return <Clock className="w-5 h-5 text-danger" />;
      case "licitacion_critica": return <FileWarning className="w-5 h-5 text-white" />;
      case "requiere_ajuste": return <AlertTriangle className="w-5 h-5 text-white" />;
      case "desvio_cfm": return <AlertTriangle className="w-5 h-5 text-white" />;
      default: return <Bell className="w-5 h-5 text-info" />;
    }
  };

  return (
    <div className="flex flex-col md:h-[calc(100vh-4rem)] h-auto min-h-screen bg-bg-secondary p-8 font-sans md:overflow-y-auto overflow-visible">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Centro de Alertas</h1>
          <p className="text-sm text-text-secondary mt-1">
            Trazabilidad inteligente de embudo. Tienes <span className="font-bold text-danger">{alerts.length}</span> alertas activas.
          </p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-bg-primary rounded-lg border border-border-subtle">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Todo al día</h2>
          <p className="text-text-secondary">No tienes alertas pendientes de trazabilidad.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map(alert => {
            const isCritica = alert.priority === 'critica';
            const isAlta = alert.priority === 'alta';

            let indicatorBg = 'bg-warning';
            let iconWrapperBg = 'bg-warning/10';
            let badgeStyle = 'bg-warning/10 text-warning border-warning/20';
            
            if (isCritica) {
              // Rojo ocre style
              indicatorBg = 'bg-[#9A3412]';
              iconWrapperBg = 'bg-[#9A3412]';
              badgeStyle = 'bg-[#9A3412] text-white border-transparent';
            } else if (isAlta) {
              indicatorBg = 'bg-danger';
              iconWrapperBg = 'bg-danger/10';
              badgeStyle = 'bg-danger/10 text-danger border-danger/20';
            }

            return (
              <div key={alert.id} className="bg-bg-primary rounded-lg shadow-sm border border-border-subtle p-5 flex items-start justify-between hover:shadow-md transition-shadow group relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${indicatorBg}`}></div>
                <div className="flex gap-4 ml-2">
                  <div className={`p-3 rounded-full shrink-0 flex items-center justify-center ${iconWrapperBg}`}>
                    {getIcon(alert.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-text-primary text-base">{alert.title}</h3>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${badgeStyle}`}>
                        {alert.priority === 'critica' ? 'crítica' : alert.priority}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary mb-2 leading-relaxed">{alert.description}</p>
                    <div className="flex items-center gap-4 text-xs font-bold text-text-muted">
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {alert.date ? format(new Date(alert.date), "dd MMM yyyy, HH:mm", { locale: es }) : "N/A"}</span>
                      <span className="flex items-center gap-1.5"><UserX className="w-3.5 h-3.5" /> Cliente: {alert.leadName}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => dismissAlert(alert.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-text-muted hover:text-text-primary hover:bg-bg-secondary rounded transition-all"
                  title="Marcar como revisado"
                >
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
